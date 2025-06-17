import { randomUUID } from 'crypto';
import { asc, eq } from 'drizzle-orm';
import { db } from '..';
import { User } from '../../types';
import { users } from '../schema/user.schema';

export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
  const u: User = {
    id: randomUUID(),
    ...user
  };

  await db.insert(users).values(u);

  return u;
};

export const getUser = async (
  userId?: string,
  email?: string
): Promise<User | null> => {
  const user = await db.query.users.findFirst({
    where: userId ? eq(users.id, userId) : eq(users.email, email!)
  });

  return user as User | null;
};

export const getAllUsers = async (
  limit: number = 50,
  offset: number = 0
): Promise<User[]> => {
  const allUsers = await db.query.users.findMany({
    orderBy: [asc(users.created_at)],
    limit,
    offset
  });

  return allUsers as User[];
};

export const updateUser = async (
  userId: string,
  user: Partial<
    Pick<User, 'email' | 'first_name' | 'last_name' | 'company' | 'role'>
  >
): Promise<User> => {
  const [update] = await db
    .update(users)
    .set({
      ...user,
      updated_at: new Date().toISOString()
    })
    .where(eq(users.id, userId))
    .returning();

  return update;
};
