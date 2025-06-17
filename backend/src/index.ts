import app from './app';
import env from './lib/env';

export default {
  port: Number(env.PORT),
  fetch: app.fetch
};
