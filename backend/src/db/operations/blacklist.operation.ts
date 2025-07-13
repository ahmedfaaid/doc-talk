import { db } from '..';
import { blacklist } from '../schema/blacklist.schema';

export const createBlacklist = async (
  token: string,
  expires: string
): Promise<void> => {
  return await db
    .insert(blacklist)
    .values({ token, expiresAt: new Date(expires).toISOString() });
};
