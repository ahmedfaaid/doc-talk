import { createRoute, z } from '@hono/zod-openapi';
import { insertMessageSchema } from '../../db/schema/message.schema';
import { serverErrorSchema } from '../../lib/constants';
import * as HttpStatusCodes from '../../lib/http-status-codes';
import { jsonContent, jsonContentRequired } from '../../lib/json-content';
import streamContent from '../../lib/stream-content';

const tags = ['chat'];

export const chat = createRoute({
  tags,
  method: 'post',
  path: '/chat',
  request: {
    body: jsonContentRequired(insertMessageSchema, 'Messsage data to create')
  },
  responses: {
    [HttpStatusCodes.OK]: streamContent(
      z.object({
        data: z.string(),
        event: z.string(),
        id: z.string()
      }),
      'The chat stream'
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        message: z.string(),
        code: z.number()
      }),
      'Validation error for message data'
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
        code: z.number()
      }),
      'Thread not found'
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      serverErrorSchema,
      'Server error'
    )
  }
});

export type ChatRoute = typeof chat;
