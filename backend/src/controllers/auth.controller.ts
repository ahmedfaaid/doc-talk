import { password } from 'bun';
import { Context } from 'hono';
import { sign } from 'hono/jwt';
import { createUser, getUser } from '../db/operations/user.operation';
import {
  INTERNAL_SERVER_ERROR,
  OK,
  UNAUTHORIZED
} from '../lib/http-status-codes';
import { LoginRoute } from '../routes/auth/auth.route';
import { AppRouteHandler } from '../types';

export const login: AppRouteHandler<LoginRoute> = async (c: Context) => {
  try {
    const { email, password: plainPassword } = await c.req.json();

    const user = await getUser(undefined, email);

    console.log({ user });

    if (!user || !(await password.verify(plainPassword, user.password))) {
      return c.json(
        { message: 'Invalid username or password', code: UNAUTHORIZED },
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

export const register = async (c: Context) => {
  try {
    const { user } = await c.req.json();

    const registerUser = await createUser({
      ...user,
      password: await password.hash(user.password)
    });

    if (!registerUser) {
      return c.json({ message: 'User already exists', code: 409 }, 409);
    }

    const payload = {
      id: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 5 * 24 * 60 * 60 * 1000 // 5 days from current date
    };
    const token = await sign(payload, process.env.JWT_SECRET_KEY!);

    return c.json(
      { token, user: { id: registerUser.id, email: registerUser.email } },
      201
    );
  } catch (error) {
    return c.json({ error: 'Failed to register' }, 500);
  }
};
