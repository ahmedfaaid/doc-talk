import { createRoute, z } from '@hono/zod-openapi';
import {
  insertDirectorySchema,
  selectDirectorySchema
} from '../../db/schema/directory.schema';
import { notFoundSchema, serverErrorSchema } from '../../lib/constants';
import createErrorSchema from '../../lib/create-error-schema';
import * as HttpStatusCodes from '../../lib/http-status-codes';
import { jsonContent, jsonContentRequired } from '../../lib/json-content';

const tags = ['directories'];

export const indexDirectory = createRoute({
  tags,
  method: 'post',
  path: '/directories',
  request: {
    body: jsonContentRequired(insertDirectorySchema, 'Directory data to index')
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({
        message: z.string(),
        code: z.number(),
        directory: selectDirectorySchema
      }),
      'Directory indexed successfully'
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(insertDirectorySchema),
      'Validation error for directory data'
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      'Directory not found'
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      serverErrorSchema,
      'Server error'
    )
  }
});

export const retrieveIndexedDirectory = createRoute({
  tags,
  method: 'get',
  path: '/directories',
  request: {
    query: z.object({
      directory: z.string()
    })
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      selectDirectorySchema,
      'The indexed directory'
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(notFoundSchema, 'No directory'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      serverErrorSchema,
      'Server error'
    )
  }
});

export type IndexDirectoryRoute = typeof indexDirectory;
export type RetrieveIndexedDirectoryRoute = typeof retrieveIndexedDirectory;
