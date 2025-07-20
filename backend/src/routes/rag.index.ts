import { ragController } from '../controllers/rag.controller';
import { createRouter } from '../lib/create-app';
import jwtMiddleware from '../middlewares/jwt';
import * as routes from './rag.route';

const router = createRouter();

router.use('/rag/query', jwtMiddleware);

router
  .openapi(routes.queryLawDocs, ragController.queryLawDocsHandler)
  .openapi(routes.healthCheck, ragController.healthCheckHandler);

export default router;
