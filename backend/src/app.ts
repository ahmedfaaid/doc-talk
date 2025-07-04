import createApp from './lib/create-app';
import openApiConfig from './lib/open-api-config';
import auth from './routes/auth/auth.index';
import chat from './routes/chat/chat.index';
import file from './routes/file/file.index';
import thread from './routes/thread/thread.index';
import user from './routes/user/user.index';

const app = createApp();

const routes = [user, thread, chat, auth, file];

openApiConfig(app);

routes.forEach(route => {
  app.route('/api/', route);
});

export default app;
