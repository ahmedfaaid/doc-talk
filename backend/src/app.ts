import createApp from './lib/create-app';
import openApiConfig from './lib/open-api-config';
import chat from './routes/chat/chat.index';
import directory from './routes/directory/directory.index';
import thread from './routes/thread/thread.index';
import user from './routes/user/user.index';

const app = createApp();

const routes = [user, directory, thread, chat];

openApiConfig(app);

routes.forEach(route => {
  app.route('/', route);
});

export default app;
