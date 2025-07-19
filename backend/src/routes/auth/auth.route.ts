import { createRoute, z } from '@hono/zod-openapi';
import {
  authSchema,
  loginSchema,
  registerSchema,
  selectUserSchema
} from '../../db/schema/user.schema';
import { notFoundSchema, serverErrorSchema } from '../../lib/constants';
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

export const me = createRoute({
  tags,
  method: 'get',
  path: 'auth/me',
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        user: selectUserSchema
      }),
      'The requested user'
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'User not found'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      serverErrorSchema,
      'Server Error'
    )
  },
  security: [
    {
      Bearer: []
    }
  ]
});

export const logout = createRoute({
  tags,
  method: 'post',
  path: 'auth/logout',
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        success: z.boolean()
      }),
      'Logout response'
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      serverErrorSchema,
      'Server error'
    )
  },
  security: [
    {
      Bearer: []
    }
  ]
});

export type LoginRoute = typeof login;
export type RegisterRoute = typeof register;
export type MeRoute = typeof me;
export type LogoutRoute = typeof logout;
