import { Context } from 'hono';
import { updateUser as updtUser } from '../db/operations/user.operation';

export const updateUser = async (c: Context) => {
  try {
    const userId = c.req.param('id');
    const { user } = await c.req.json();

    const updatedUser = await updtUser(userId, user);

    return c.json(updatedUser, 200);
  } catch (error) {
    return c.json({ error: 'Failed to update user' }, 500);
  }
};
