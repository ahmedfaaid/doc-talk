import { threadController } from '../../controllers';
import { createRouter } from '../../lib/create-app';
import * as routes from './thread.route';

const router = createRouter().openapi(
  routes.createThread,
  threadController.createThread
);

export default router;
