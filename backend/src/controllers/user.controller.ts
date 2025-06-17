import { Context } from 'hono';
import { updateUser as updtUser } from '../db/operations/user.operation';
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from '../lib/constants';
import {
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  OK,
  UNPROCESSABLE_ENTITY
} from '../lib/http-status-codes';
import { NOT_FOUND as NOT_FOUND_PHRASE } from '../lib/http-status-phrases';
import { UpdateUserRoute } from '../routes/user/user.route';
import { AppRouteHandler } from '../types';

export const updateUser: AppRouteHandler<UpdateUserRoute> = async (
  c: Context
) => {
  try {
    const userId = c.req.param('id');
    const { user } = await c.req.json();

    if (Object.keys(user).length === 0) {
      return c.json(
        {
          success: false,
          error: {
            issues: [
              {
                code: ZOD_ERROR_CODES.INVALID_UPDATES,
                path: [],
                message: ZOD_ERROR_MESSAGES.NO_UPDATES
              }
            ],
            name: 'ZodError'
          }
        },
        UNPROCESSABLE_ENTITY
      );
    }

    const updatedUser = await updtUser(userId, user);

    if (!updtUser)
      return c.json(
        {
          message: NOT_FOUND_PHRASE
        },
        NOT_FOUND
      );

    const { password, ...rest } = updatedUser;

    return c.json(rest, OK);
  } catch (error) {
    return c.json({ message: 'Failed to update user' }, INTERNAL_SERVER_ERROR);
  }
};
