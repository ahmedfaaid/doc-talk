import { OpenAPIHono } from '@hono/zod-openapi';
import { csrf } from 'hono/csrf';
import jwtMiddleware from '../middlewares/jwt';
import notFound from '../middlewares/not-found';
import onError from '../middlewares/on-error';
import pinoLogger from '../middlewares/pino-logger';
import { AppBindings } from '../types';
import defaultHook from './default-hook';

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook
  });
}

export default function createApp() {
  const app = createRouter();

  app.notFound(notFound);
  app.onError(onError);
  app.use(pinoLogger());

  app.use('/api/*', csrf());
  app.use('/api/*', async (c, next) => {
    if (c.req.path.startsWith('/api/auth') && c.req.path !== '/api/auth/me') {
      return next();
    }

    return jwtMiddleware(c, next);
  });

  app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT'
  });

  app.get('/error', c => {
    c.status(422);
    c.var.logger.info('Some logs here');
    throw new Error('Something went wrong');
  });

  app.get('/', c => {
    return c.json({
      message: 'Hello from Doc-Talk'
    });
  });

  return app;
}
