import { and, eq, inArray } from 'drizzle-orm';
import { db } from '..';
import hasAccess, { getAccessibleRoles } from '../../lib/access';
import { File } from '../../types';
import { files } from '../schema/file.schema';
import { users } from '../schema/user.schema';
import { getUser } from './user.operation';

export const uploadFile = async (
  file: Omit<
    File,
    | 'ownerId'
    | 'owner'
    | 'uploadStatus'
    | 'vectorStatus'
    | 'createdAt'
    | 'uploadCompletedAt'
    | 'vectorCompletedAt'
  >,
  userId: string
): Promise<File | null> => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      parent: true
    }
  });

  if (!user) {
    return null;
  }

  let ownerId: string;

  if (user.parentId && user.parent) {
    ownerId = user.parentId;
  } else {
    ownerId = user.id;
  }

  if (!hasAccess(user.role, file.accessLevel)) {
    throw new Error('User does not have permission to upload this file');
  }

  const [newFile] = await db
    .insert(files)
    .values({ ...file, ownerId, uploadStatus: 'uploading' })
    .returning();

  return newFile as File;
};

export const updateUploadProgress = async (
  uploadId: string,
  status: 'uploading' | 'completed' | 'failed'
): Promise<File> => {
  const [updatedFile] = await db
    .update(files)
    .set({
      uploadStatus: status,
      uploadCompletedAt: status === 'completed' ? new Date().toISOString() : ''
    })
    .where(eq(files.id, uploadId))
    .returning();

  return updatedFile as File;
};

export const updateVectorProgress = async (
  uploadId: string,
  status: 'processing' | 'completed' | 'failed',
  vectorStorePath?: string
): Promise<File> => {
  const [updatedFile] = await db
    .update(files)
    .set({
      vectorStatus: status,
      vectorCompletedAt: new Date().toISOString(),
      vectorStorePath: vectorStorePath || ''
    })
    .where(eq(files.id, uploadId))
    .returning();

  return updatedFile as File;
};

export const getUserFiles = async (userId: string): Promise<File[]> => {
  const user = await getUser(userId, undefined);

  if (!user) {
    return [];
  }

  let filesOwnerId: string;

  if (user.parentId && user.parent) {
    filesOwnerId = user.parentId;
  } else {
    filesOwnerId = user.id;
  }

  const accessibleRoles = getAccessibleRoles(user.role);

  if (accessibleRoles.length === 0) {
    return [];
  }

  const searchedFiles = await db.query.files.findMany({
    where: inArray(files.accessLevel, accessibleRoles),
    with: {
      owner: true
    }
  });

  return searchedFiles as File[];
};

export const getFileById = async (
  fileId: string,
  userId: string
): Promise<File | null> => {
  const user = await getUser(userId, undefined);

  if (!user) {
    return null;
  }

  const accessibleRoles = getAccessibleRoles(user.role);

  if (accessibleRoles.length === 0) {
    return null;
  }

  const file = await db.query.files.findFirst({
    where: and(
      eq(files.id, fileId),
      eq(files.ownerId, user.parentId || user.id),
      inArray(files.accessLevel, accessibleRoles)
    )
  });

  if (!file) {
    return null;
  }

  if (!hasAccess(user.role, file.accessLevel!)) {
    throw new Error('User does not have permission to access this file');
  }

  return file as File;
};
