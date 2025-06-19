import { createRoute, z } from '@hono/zod-openapi';
import { authSchema, loginSchema } from '../../db/schema/user.schema';
import { serverErrorSchema } from '../../lib/constants';
import * as HttpStatusCodes from '../../lib/http-status-codes';
import { jsonContent, jsonContentRequired } from '../../lib/json-content';
const tags = ['auth'];

export const login = createRoute({
  tags,
  method: 'post',
  path: '/auth/login',
  request: {
    body: jsonContentRequired(loginSchema, 'Login request body')
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(authSchema, 'Login response'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({
        message: z.string(),
        code: z.number()
      }),
      'Unauthorized response'
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      serverErrorSchema,
      'Server error'
    )
  }
});

export type LoginRoute = typeof login;
