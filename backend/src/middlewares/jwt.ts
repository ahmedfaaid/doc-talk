import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import env from '../lib/env';
import { INTERNAL_SERVER_ERROR, UNAUTHORIZED } from '../lib/http-status-codes';
import { JWTPayload } from '../types';

const jwtMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json(
        { message: 'Unauthorized', code: UNAUTHORIZED },
        UNAUTHORIZED
      );
    }

    const token = authHeader.split(' ')[1];
    const payload = (await verify(token, env.JWT_SECRET_KEY)) as JWTPayload;

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return c.json(
        { message: 'Unauthorized', code: UNAUTHORIZED },
        UNAUTHORIZED
      );
    }

    c.set('user', { id: payload.id, email: payload.email, token });

    await next();
  } catch (error) {
    return c.json({ message: (error as Error).message }, INTERNAL_SERVER_ERROR);
  }
};

export default jwtMiddleware;
