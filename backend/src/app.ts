import createApp from './lib/create-app';
import openApiConfig from './lib/open-api-config';
import directory from './routes/directory/directory.index';
import user from './routes/user/user.index';

const app = createApp();

const routes = [user, directory];

openApiConfig(app);

routes.forEach(route => {
  app.route('/', route);
});

export default app;
