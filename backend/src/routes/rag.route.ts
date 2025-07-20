import { createRoute, z } from '@hono/zod-openapi';
import { jsonContent } from '../lib/json-content';
import * as HttpStatusCodes from '../lib/http-status-codes';

const tags = ['rag'];

export const queryLawDocs = createRoute({
  tags,
  method: 'post',
  path: '/rag/query',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            userId: z.string(),
            uploadId: z.string(),
            query: z.string(),
            topK: z.number().optional()
          })
        }
      }
    }
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        results: z.array(z.any()),
        message: z.string()
      }),
      'Relevant law document chunks'
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string() }),
      'Invalid request'
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      'Unauthorized'
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string() }),
      'Server error'
    )
  }
});

export const healthCheck = createRoute({
  tags: ['health'],
  method: 'get',
  path: '/health',
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        'application/json': {
          schema: z.object({
            status: z.string()
          })
        }
      },
      description: 'Health check status'
    }
  }
});

