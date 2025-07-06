import { createRoute, z } from '@hono/zod-openapi';
import {
  insertFileSchema,
  selectFileSchema
} from '../../db/schema/file.schema';
import { notFoundSchema, serverErrorSchema } from '../../lib/constants';
import * as HttpStatusCodes from '../../lib/http-status-codes';
import idParamsSchema from '../../lib/id-params';
import { jsonContent } from '../../lib/json-content';
import streamContent from '../../lib/stream-content';

const tags = ['files'];

export const uploadFile = createRoute({
  tags,
  method: 'post',
  path: '/files/upload',
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: insertFileSchema.extend({
            file: z.instanceof(File).describe('The file to upload')
          })
        }
      }
    }
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({
        message: z.string(),
        code: z.number(),
        file: selectFileSchema.extend({
          progressUrl: z.string(),
          vectorProgressUrl: z.string().optional(),
          supportsVectorProcessing: z.boolean().optional()
        })
      }),
      'File uploaded successfully'
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      notFoundSchema,
      'File could not be uploaded'
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      serverErrorSchema,
      'Server Error'
    )
  }
});

export const uploadProgress = createRoute({
  tags,
  method: 'get',
  path: '/files/upload/progress/{id}',
  request: {
    params: idParamsSchema
  },
  responses: {
    [HttpStatusCodes.OK]: streamContent(
      z.object({
        data: z.string(),
        event: z.string()
      }),
      'The upload progress stream'
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        message: z.string(),
        code: z.number()
      }),
      'Validation error for file upload progress'
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
        code: z.number()
      }),
      'Upload not found'
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      serverErrorSchema,
      'Server error'
    )
  }
});

export const vectorProgress = createRoute({
  tags: [...tags, 'vector'],
  method: 'get',
  path: '/files/vector/progress/{id}',
  request: {
    params: idParamsSchema
  },
  responses: {
    [HttpStatusCodes.OK]: streamContent(
      z.object({
        data: z.string(),
        event: z.string()
      }),
      'The vector progress stream'
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        message: z.string(),
        code: z.number()
      }),
      'Validation error for file vector progress'
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
        code: z.number()
      }),
      'Upload not found'
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      serverErrorSchema,
      'Server error'
    )
  }
});

export type UploadFileRoute = typeof uploadFile;
export type UploadProgressRoute = typeof uploadProgress;
export type VectorProgressRoute = typeof vectorProgress;
