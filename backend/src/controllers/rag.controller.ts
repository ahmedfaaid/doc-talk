import { retrieveHybridContext } from '../lib/rag.js';
import * as HttpStatusCodes from '../lib/http-status-codes.js';
import { AppRouteHandler } from '../types/index.js';
import { queryLawDocs, healthCheck } from '../routes/rag.route.js';

export const queryLawDocsHandler: AppRouteHandler<typeof queryLawDocs> = async (c: any) => {
  try {
    const { userId, uploadId, query, topK } = c.req.valid('json');
    const user = c.get('user');
    if (!user || user.id !== userId) {
      return c.json({ message: 'Unauthorized' }, HttpStatusCodes.UNAUTHORIZED);
    }
    const hybrid = await retrieveHybridContext({
      userId,
      uploadId,
      query,
      topK
    });
    return c.json({ ...hybrid, message: 'Success' }, HttpStatusCodes.OK);
  } catch (error) {
    return c.json(
      { message: (error as Error).message },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
}


export const healthCheckHandler: AppRouteHandler<typeof healthCheck> = async (c: any) => {
  return c.json({ status: 'ok' }, HttpStatusCodes.OK);
};

export const ragController = {
  queryLawDocsHandler,
  healthCheckHandler
};
