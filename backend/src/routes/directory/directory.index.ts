import { directoryController } from '../../controllers';
import { createRouter } from '../../lib/create-app';
import * as routes from './directory.route';

const router = createRouter()
  .openapi(routes.indexDirectory, directoryController.indexDirectory)
  .openapi(
    routes.retrieveIndexedDirectory,
    directoryController.retrieveIndexedDirectory
  );

export default router;
