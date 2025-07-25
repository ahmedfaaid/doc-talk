import { createRoute } from '@hono/zod-openapi';
import {
  selectUserSchema,
  updateUserSchema
} from '../../db/schema/user.schema';
import { notFoundSchema, serverErrorSchema } from '../../lib/constants';
import createErrorSchema from '../../lib/create-error-schema';
import * as HttpStatusCodes from '../../lib/http-status-codes';
import { jsonContent, jsonContentRequired } from '../../lib/json-content';
import userIdParamsSchema from '../../lib/user-id-params';

const tags = ['users'];

export const updateUser = createRoute({
  tags,
  method: 'put',
  path: '/users/{id}',
  request: {
    params: userIdParamsSchema,
    body: jsonContentRequired(updateUserSchema, 'The user data to update')
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(selectUserSchema, 'The updated user'),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(updateUserSchema).or(
        createErrorSchema(userIdParamsSchema)
      ),
      'Validation error for the user data or user ID'
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'User not found'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      serverErrorSchema,
      'Server error'
    )
  }
});

export type UpdateUserRoute = typeof updateUser;
