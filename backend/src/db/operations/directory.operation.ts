import { and, eq, inArray } from 'drizzle-orm';
import { db } from '..';
import { Directory } from '../../types';
import { directories } from '../schema/directory.schema';
import { users } from '../schema/user.schema';
import { getUser } from './user.operation';

export const createDirectory = async (
  directoryData: {
    name: string;
    directory_path: string;
    vector_path?: string;
  },
  userId: string
): Promise<Directory | null> => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) {
    return null;
  }

  let ownerId: string;

  if (user.parent_id) {
    ownerId = user.parent_id;
  } else {
    ownerId = user.id;
  }

  const [newDirectory] = await db
    .insert(directories)
    .values({
      name: directoryData.name,
      directory_path: directoryData.directory_path,
      vector_path:
        directoryData.vector_path || `${directoryData.directory_path}/vectors`,
      owner_id: ownerId,
      indexed: false
    })
    .returning();

  return newDirectory as Directory;
};

export const getDirectory = async (path: string): Promise<Directory | null> => {
  const directory = await db.query.directories.findFirst({
    where: eq(directories.directory_path, path),
    with: {
      owner: true
    }
  });
  return directory as Directory | null;
};

export const getUserDirectories = async (
  userId: string
): Promise<Directory[]> => {
  const user = await getUser(userId, undefined);

  if (!user) {
    return [];
  }

  let accessibleUserIds: string[] = [];

  if (user.parent_id && user.parent) {
    const parentId = user.parent_id;

    switch (user.role) {
      case 'superadmin':
        const parentSubUsers = await db.query.users.findMany({
          where: eq(users.parent_id, parentId),
          columns: { id: true }
        });
        accessibleUserIds = [parentId, ...parentSubUsers.map(u => u.id)];
        break;
      case 'admin':
        const ownSubUsers = await db.query.users.findMany({
          where: eq(users.parent_id, user.id),
          columns: { id: true }
        });
        accessibleUserIds = [parentId, user.id, ...ownSubUsers.map(u => u.id)];
        break;
      case 'user':
      default:
        accessibleUserIds = [parentId];
        break;
    }
  } else {
    switch (user.role) {
      case 'superadmin':
        const allSubUsers = await db.query.users.findMany({
          where: eq(users.parent_id, user.id),
          columns: { id: true }
        });
        accessibleUserIds = [user.id, ...allSubUsers.map(u => u.id)];
        break;
      case 'admin':
        const subUsers = await db.query.users.findMany({
          where: eq(users.parent_id, user.id),
          columns: { id: true }
        });
        accessibleUserIds = [user.id, ...subUsers.map(u => u.id)];
        break;
      case 'user':
      default:
        accessibleUserIds = [user.id];
        break;
    }
  }

  const userDirectories = await db.query.directories.findMany({
    where: inArray(directories.owner_id, accessibleUserIds),
    with: {
      owner: {
        columns: {
          id: true,
          email: true,
          first_name: true,
          last_name: true
        }
      }
    }
  });

  return userDirectories as Directory[];
};

export const getDirectoryByPath = async (
  path: string,
  userId: string
): Promise<Directory | null> => {
  const user = await getUser(userId, undefined);

  if (!user) {
    return null;
  }

  const directory = await getDirectory(path);

  if (!directory) {
    return null;
  }

  let hasAccess = false;

  if (user.parent_id) {
    const parentId = user.parent_id;
    switch (user.role) {
      case 'superadmin':
        if (directory.owner_id === parentId) {
          hasAccess = true;
        } else {
          const isParentSubUser = await db.query.users.findFirst({
            where: and(
              eq(users.id, directory.owner_id),
              eq(users.parent_id, parentId)
            )
          });
          hasAccess = !!isParentSubUser;
        }
        break;
      case 'admin':
        if (directory.owner_id === parentId || directory.owner_id === userId) {
          hasAccess = true;
        } else {
          const isOwnSubUser = await db.query.users.findFirst({
            where: and(
              eq(users.id, directory.owner_id),
              eq(users.parent_id, user.id)
            )
          });
          hasAccess = !!isOwnSubUser;
        }
        break;
      case 'user':
      default:
        hasAccess = directory.owner_id === parentId;
        break;
    }
  } else {
    switch (user.role) {
      case 'superadmin':
      case 'admin':
        // Can access own directories and sub-users' directories
        if (directory.owner_id === user.id) {
          hasAccess = true;
        } else {
          const isSubUser = await db.query.users.findFirst({
            where: and(
              eq(users.id, directory.owner_id),
              eq(users.parent_id, user.id)
            )
          });
          hasAccess = !!isSubUser;
        }
        break;

      case 'user':
      default:
        hasAccess = directory.owner_id === user.id;
        break;
    }
  }

  return hasAccess ? (directory as Directory) : null;
};

export const getDirectoryById = async (
  directoryId: string,
  userId: string
): Promise<Directory | null> => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) {
    return null;
  }

  const directory = await db.query.directories.findFirst({
    where: eq(directories.id, directoryId),
    with: {
      owner: true
    }
  });

  if (!directory) {
    return null;
  }

  let hasAccess = false;

  if (user.parent_id) {
    const parentId = user.parent_id;

    switch (user.role) {
      case 'superadmin':
        if (directory.owner_id === parentId) {
          hasAccess = true;
        } else {
          const isParentSubUser = await db.query.users.findFirst({
            where: and(
              eq(users.id, directory.owner_id),
              eq(users.parent_id, parentId)
            )
          });
          hasAccess = !!isParentSubUser;
        }
        break;

      case 'admin':
        if (directory.owner_id === parentId || directory.owner_id === user.id) {
          hasAccess = true;
        } else {
          const isOwnSubUser = await db.query.users.findFirst({
            where: and(
              eq(users.id, directory.owner_id),
              eq(users.parent_id, user.id)
            )
          });
          hasAccess = !!isOwnSubUser;
        }
        break;

      case 'user':
      default:
        hasAccess = directory.owner_id === parentId;
        break;
    }
  } else {
    switch (user.role) {
      case 'superadmin':
      case 'admin':
        if (directory.owner_id === user.id) {
          hasAccess = true;
        } else {
          const isSubUser = await db.query.users.findFirst({
            where: and(
              eq(users.id, directory.owner_id),
              eq(users.parent_id, user.id)
            )
          });
          hasAccess = !!isSubUser;
        }
        break;

      case 'user':
      default:
        hasAccess = directory.owner_id === user.id;
        break;
    }
  }

  return hasAccess ? (directory as Directory) : null;
};
