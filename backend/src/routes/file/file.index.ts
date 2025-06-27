import { fileController } from '../../controllers';
import { createRouter } from '../../lib/create-app';
import * as routes from './file.route';

const router = createRouter().openapi(
  routes.uploadFile,
  fileController.uploadFile
);

export default router;
