import { createRoute, z } from '@hono/zod-openapi';
import {
  insertThreadSchema,
  selectThreadSchema
} from '../../db/schema/thread.schema';
import { notFoundSchema, serverErrorSchema } from '../../lib/constants';
import * as HttpStatusCodes from '../../lib/http-status-codes';
import { jsonContent, jsonContentRequired } from '../../lib/json-content';
import userIdParamsSchema from '../../lib/user-id-params';

const tags = ['threads'];

export const createThread = createRoute({
  tags,
  method: 'post',
  path: '/threads',
  request: {
    body: jsonContentRequired(insertThreadSchema, 'Thread data to create')
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      selectThreadSchema,
      'Thread created successfully'
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        message: z.string(),
        code: z.number()
      }),
      'Validation error for thread data'
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      serverErrorSchema,
      'Server error'
    )
  }
});

export const getThreads = createRoute({
  tags,
  method: 'get',
  path: '/threads',
  request: {
    query: z.object({
      limit: z.string().optional(),
      offset: z.string().optional()
    })
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(selectThreadSchema),
      'List of threads'
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      serverErrorSchema,
      'Server error'
    )
  }
});

export const getOneThread = createRoute({
  tags,
  method: 'get',
  path: '/threads/{id}',
  request: {
    params: userIdParamsSchema
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectThreadSchema,
      'The requested thread'
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      'Thread not found'
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      serverErrorSchema,
      'Server error'
    )
  }
});

export const deleteOneThread = createRoute({
  tags,
  method: 'delete',
  path: '/threads/{id}',
  request: {
    params: userIdParamsSchema
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        success: z.boolean()
      }),
      'Thread deleted successfully'
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      serverErrorSchema,
      'Server error'
    )
  }
});

export type CreateThreadRoute = typeof createThread;
export type GetThreadsRoute = typeof getThreads;
export type GetOneThreadRoute = typeof getOneThread;
export type DeleteOneThread = typeof deleteOneThread;
