import createApp from './lib/create-app';
import openApiConfig from './lib/open-api-config';
import user from './routes/user/user.index';

const app = createApp();

const routes = [user];

openApiConfig(app);

routes.forEach(route => {
  app.route('/', route);
});

export default app;
