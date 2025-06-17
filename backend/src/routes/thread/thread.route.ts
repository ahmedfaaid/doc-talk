import { createRoute, z } from '@hono/zod-openapi';
import {
  insertThreadSchema,
  selectThreadSchema
} from '../../db/schema/thread.schema';
import { serverErrorSchema } from '../../lib/constants';
import * as HttpStatusCodes from '../../lib/http-status-codes';
import { jsonContent, jsonContentRequired } from '../../lib/json-content';

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

export type CreateThreadRoute = typeof createThread;
