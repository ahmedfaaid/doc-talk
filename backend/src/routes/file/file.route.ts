import { createRoute, z } from '@hono/zod-openapi';
import {
  insertFileSchema,
  selectFileSchema
} from '../../db/schema/file.schema';
import { notFoundSchema, serverErrorSchema } from '../../lib/constants';
import * as HttpStatusCodes from '../../lib/http-status-codes';
import { jsonContent } from '../../lib/json-content';

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

export type UploadFileRoute = typeof uploadFile;
