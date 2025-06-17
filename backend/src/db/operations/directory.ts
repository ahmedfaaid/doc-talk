import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '..';
import { Directory } from '../../types';
import { directories } from '../schema/directory';

export const addDirectory = async (
  path: string,
  name: string,
  vector_path: string,
  indexed: boolean
): Promise<Directory> => {
  const directory: Directory = {
    id: randomUUID(),
    name,
    directory_path: path,
    vector_path,
    indexed,
    created_at: new Date().toISOString()
  };

  await db.insert(directories).values(directory);

  return directory;
};

export const getDirectory = async (path: string): Promise<Directory | null> => {
  const directory = await db.query.directories.findFirst({
    where: eq(directories.directory_path, path)
  });
  return directory as Directory | null;
};
