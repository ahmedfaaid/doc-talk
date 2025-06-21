import { createRoute, z } from '@hono/zod-openapi';
import {
  authSchema,
  loginSchema,
  registerSchema
} from '../../db/schema/user.schema';
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

export const register = createRoute({
  tags,
  method: 'post',
  path: '/auth/register',
  request: {
    body: jsonContentRequired(
      z.object({
        user: registerSchema
      }),
      'Register request body'
    )
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(authSchema, 'Register response'),
    [HttpStatusCodes.CONFLICT]: jsonContent(
      z.object({
        message: z.string(),
        code: z.number()
      }),
      'Conflict response'
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      serverErrorSchema,
      'Server error'
    )
  }
});

export type LoginRoute = typeof login;
export type RegisterRoute = typeof register;
