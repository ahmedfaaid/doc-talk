import { fileController } from '../../controllers';
import { createRouter } from '../../lib/create-app';
import * as routes from './file.route';

const router = createRouter()
  .openapi(routes.uploadFile, fileController.uploadFile)
  .openapi(routes.uploadProgress, fileController.uploadProgress)
  .openapi(routes.vectorProgress, fileController.vectorProgress);

export default router;
