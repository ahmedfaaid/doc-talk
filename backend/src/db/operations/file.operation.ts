import { eq } from 'drizzle-orm';
import { db } from '..';
import { File } from '../../types';
import { files } from '../schema/file.schema';
import { users } from '../schema/user.schema';

export const uploadFile = async (
  file: Omit<
    File,
    'owner_id' | 'owner' | 'status' | 'created_at' | 'completed_at'
  >,
  userId: string
): Promise<File | null> => {
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

  const [newFile] = await db
    .insert(files)
    .values({ ...file, owner_id: ownerId, status: 'uploading' })
    .returning();

  return newFile as File;
};

export const updateUploadProgress = async (
  upload_id: string,
  status: 'uploading' | 'completed' | 'failed'
): Promise<File> => {
  const [updatedFile] = await db
    .update(files)
    .set({
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : ''
    })
    .where(eq(files.id, upload_id))
    .returning();

  return updatedFile as File;
};
