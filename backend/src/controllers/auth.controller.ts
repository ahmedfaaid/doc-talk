import { password } from 'bun';
import { Context } from 'hono';
import { decode, sign } from 'hono/jwt';
import { createBlacklist } from '../db/operations/blacklist.operation';
import { createUser, getUser } from '../db/operations/user.operation';
import env from '../lib/env';
import {
  CONFLICT,
  CREATED,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  OK,
  UNAUTHORIZED
} from '../lib/http-status-codes';
import {
  LoginRoute,
  LogoutRoute,
  MeRoute,
  RegisterRoute
} from '../routes/auth/auth.route';
import { AppRouteHandler } from '../types';

export const login: AppRouteHandler<LoginRoute> = async (c: Context) => {
  try {
    const { email, password: plainPassword } = await c.req.json();

    const user = await getUser(undefined, email);

    if (!user || !(await password.verify(plainPassword, user.password))) {
      return c.json(
        { message: 'Invalid email or password', code: UNAUTHORIZED },
        UNAUTHORIZED
      );
    }

    const payload = {
      id: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 5 * 24 * 60 * 60 * 1000 // 5 days from current date
    };
    const token = await sign(payload, process.env.JWT_SECRET_KEY!);

    return c.json({ token, user: { id: user.id, email: user.email } }, OK);
  } catch (error) {
    return c.json({ message: (error as Error).message }, INTERNAL_SERVER_ERROR);
  }
};

export const register: AppRouteHandler<RegisterRoute> = async (c: Context) => {
  try {
    const { user } = await c.req.json();

    const registerUser = await createUser({
      ...user,
      password: await password.hash(user.password)
    });

    if (!registerUser) {
      return c.json(
        { message: 'User already exists', code: CONFLICT },
        CONFLICT
      );
    }

    const payload = {
      id: registerUser.id,
      email: registerUser.email,
      exp: Math.floor(Date.now() / 1000) + 5 * 24 * 60 * 60 * 1000 // 5 days from current date
    };
    const token = await sign(payload, env.JWT_SECRET_KEY!);

    return c.json(
      { token, user: { id: registerUser.id, email: registerUser.email } },
      CREATED
    );
  } catch (error) {
    return c.json({ message: (error as Error).message }, INTERNAL_SERVER_ERROR);
  }
};

export const me: AppRouteHandler<MeRoute> = async (c: Context) => {
  try {
    const payload = c.get('user');

    const user = await getUser(payload.id, undefined);

    if (!user) {
      return c.json({ message: 'User not found', code: NOT_FOUND }, NOT_FOUND);
    }
    const { password, ...rest } = user;
    return c.json({ user: rest }, OK);
  } catch (error) {
    return c.json({ message: (error as Error).message }, INTERNAL_SERVER_ERROR);
  }
};

export const logout: AppRouteHandler<LogoutRoute> = async (c: Context) => {
  try {
    const user = c.get('user');
    const decodedToken = decode(user.token);

    await createBlacklist(user.token, decodedToken.payload.expires as number);

    return c.json({ success: true }, OK);
  } catch (error) {
    return c.json({ message: (error as Error).message }, INTERNAL_SERVER_ERROR);
  }
};
