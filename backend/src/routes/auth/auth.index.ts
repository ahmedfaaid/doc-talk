import { authController } from '../../controllers';
import { createRouter } from '../../lib/create-app';
import * as routes from './auth.route';

const router = createRouter().openapi(routes.login, authController.login);

export default router;
