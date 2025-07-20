import { retrieveRelevantChunks } from '../lib/rag';
import * as HttpStatusCodes from '../lib/http-status-codes';
import { AppRouteHandler } from '../types';
import { queryLawDocs, healthCheck } from '../routes/rag.route';

export const queryLawDocsHandler: AppRouteHandler<typeof queryLawDocs> = async c => {
  try {
    const { userId, uploadId, query, topK } = c.req.valid('json');
    const user = c.get('user');
    if (!user || user.id !== userId) {
      return c.json({ message: 'Unauthorized' }, HttpStatusCodes.UNAUTHORIZED);
    }
    const results = await retrieveRelevantChunks({
      userId,
      uploadId,
      query,
      topK
    });
    return c.json({ results, message: 'Success' }, HttpStatusCodes.OK);
  } catch (error) {
    return c.json(
      { message: (error as Error).message },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const healthCheckHandler: AppRouteHandler<
  typeof healthCheck
> = async c => {
  return c.json({ status: 'ok' }, HttpStatusCodes.OK);
};

export const ragController = {
  queryLawDocsHandler,
  healthCheckHandler
};
