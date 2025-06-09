import { Context } from 'hono';
import { createThread as ct, getAllThreads } from '../../db/thread';

export const createThread = async (c: Context) => {
  const { title, metadata } = await c.req.json();

  try {
    if (!title) {
      return c.json({ message: 'Title is required', code: 400 }, 400);
    }

    const thread = ct(title, metadata);
    return c.json(thread, 201);
  } catch (error) {
    return c.json({ error: 'Failed to create thread' }, 500);
  }
};

export const getThreads = async (c: Context) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    const threads = getAllThreads(limit, offset);
    return c.json(threads);
  } catch (error) {
    return c.json({ error: 'Failed to fetch threads' }, 500);
  }
};
