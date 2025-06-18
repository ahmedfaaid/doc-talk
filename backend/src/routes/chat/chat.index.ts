import { chatController } from '../../controllers';
import { createRouter } from '../../lib/create-app';
import * as routes from './chat.route';

const router = createRouter().openapi(routes.chat, chatController.chat);

export default router;
