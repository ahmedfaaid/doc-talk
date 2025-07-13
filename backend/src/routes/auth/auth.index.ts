import { authController } from '../../controllers';
import { createRouter } from '../../lib/create-app';
import * as routes from './auth.route';

const router = createRouter()
  .openapi(routes.login, authController.login)
  .openapi(routes.register, authController.register)
  .openapi(routes.me, authController.me)
  .openapi(routes.logout, authController.logout);

export default router;
