import { threadController } from '../../controllers';
import { createRouter } from '../../lib/create-app';
import * as routes from './thread.route';

const router = createRouter()
  .openapi(routes.createThread, threadController.createThread)
  .openapi(routes.getThreads, threadController.getThreads)
  .openapi(routes.getOneThread, threadController.getOneThread)
  .openapi(routes.deleteOneThread, threadController.deleteOneThread);

export default router;
