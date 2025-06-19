import createApp from './lib/create-app';
import openApiConfig from './lib/open-api-config';
import auth from './routes/auth/auth.index';
import chat from './routes/chat/chat.index';
import directory from './routes/directory/directory.index';
import thread from './routes/thread/thread.index';
import user from './routes/user/user.index';

const app = createApp();

const routes = [user, directory, thread, chat, auth];

openApiConfig(app);

routes.forEach(route => {
  app.route('/api/', route);
});

export default app;
