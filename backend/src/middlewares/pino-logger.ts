import { pinoLogger as logger } from 'hono-pino';
import pino from 'pino';
import env from '../lib/env';

function pinoLogger() {
  return logger({
    pino:
      env.NODE_ENV === 'production'
        ? undefined
        : pino({
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true
              }
            },
            level: env.LOG_LEVEL || 'info'
          }),
    http: {
      reqId: () => crypto.randomUUID()
    }
  });
}

export default pinoLogger;
