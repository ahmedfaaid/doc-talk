<<<<<<< HEAD
import { eq } from 'drizzle-orm';
import { db } from '..';
import { Blacklist } from '../../types';
=======
import { db } from '..';
>>>>>>> 455d251 (backend: create blacklist operation)
import { blacklist } from '../schema/blacklist.schema';

export const createBlacklist = async (
  token: string,
<<<<<<< HEAD
  expires: number
=======
  expires: string
>>>>>>> 455d251 (backend: create blacklist operation)
): Promise<void> => {
  return await db
    .insert(blacklist)
    .values({ token, expiresAt: new Date(expires).toISOString() });
};
<<<<<<< HEAD

export const getBlacklist = async (
  token: string
): Promise<Blacklist | null> => {
  const searchedBlacklist = await db.query.blacklist.findFirst({
    where: eq(blacklist?.token, token)
  });

  if (!searchedBlacklist) {
    return null;
  }

  return searchedBlacklist as Blacklist;
};
=======
>>>>>>> 455d251 (backend: create blacklist operation)
