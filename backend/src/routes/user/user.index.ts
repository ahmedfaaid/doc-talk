import { userController } from '../../controllers';
import { createRouter } from '../../lib/create-app';
import * as routes from './user.route';

const router = createRouter().openapi(
  routes.updateUser,
  userController.updateUser
);

export default router;
