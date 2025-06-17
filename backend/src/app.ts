import createApp from './lib/create-app';
import user from './routes/user/user.index';

const app = createApp();

const routes = [user];

routes.forEach(route => {
  app.route('/', route);
});

export default app;
