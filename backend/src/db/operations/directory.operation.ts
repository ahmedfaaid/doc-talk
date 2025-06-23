import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
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
