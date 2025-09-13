import { z } from 'zod';
import { createRoute } from '@hono/zod-openapi';
import { legalAgentController } from '../controllers/legal-agent.controller';

export const legalQuery = createRoute({
  method: 'post',
  path: '/legal-agent/query',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            userId: z.string().min(1),
            fileId: z.string().min(1),
            query: z.string().min(1),
            jurisdiction: z.string().optional(),
            documentType: z.string().optional()
          })
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Legal query processed successfully',
      content: {
        'text/event-stream': {}
      }
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            status: z.string().optional()
          })
        }
      }
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string()
          })
        }
      }
    },
    404: {
      description: 'Not found',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string()
          })
        }
      }
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string()
          })
        }
      }
    }
  },
  tags: ['Legal Agent']
});

export const legalAgentRoutes = [
  legalQuery
];