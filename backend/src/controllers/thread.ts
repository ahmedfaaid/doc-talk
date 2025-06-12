import { Context } from 'hono';
import {
  createThread as ct,
  deleteThread,
  getAllThreads,
  getThread
} from '../../db/operations/thread';

export const createThread = async (c: Context) => {
  try {
    const { title, metadata } = await c.req.json();

    if (!title) {
      return c.json({ message: 'Title is required', code: 400 }, 400);
    }

    const thread = await ct(title, metadata);
    return c.json(thread, 201);
  } catch (error) {
    return c.json({ error: 'Failed to create thread' }, 500);
  }
};

export const getThreads = async (c: Context) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    const threads = await getAllThreads(limit, offset);
    return c.json(threads);
  } catch (error) {
    return c.json({ error: 'Failed to fetch threads' }, 500);
  }
};

export const getOneThread = async (c: Context) => {
  try {
    const threadId = c.req.param('id');
    const thread = await getThread(threadId);

    if (!thread) {
      return c.json({ message: 'Thread not found', code: 404 }, 404);
    }

    return c.json(thread);
  } catch (error) {
    return c.json({ error: 'Failed to fetch thread' }, 500);
  }
};

export const deleteOneThread = async (c: Context) => {
  try {
    const threadId = c.req.param('id');
    await deleteThread(threadId);

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to delete thread' }, 500);
  }
};
