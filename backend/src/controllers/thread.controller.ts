import { Context } from 'hono';
import {
  createThread as ct,
  deleteThread,
  getAllThreads,
  getThread
} from '../db/operations/thread.operation';
import {
  BAD_REQUEST,
  CREATED,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  OK
} from '../lib/http-status-codes';
import {
  CreateThreadRoute,
  DeleteOneThread,
  GetOneThreadRoute,
  GetThreadsRoute
} from '../routes/thread/thread.route';
import { AppRouteHandler } from '../types';

export const createThread: AppRouteHandler<CreateThreadRoute> = async (
  c: Context
) => {
  try {
    const { title, metadata } = await c.req.json();

    if (!title) {
      return c.json(
        { message: 'Title is required', code: BAD_REQUEST },
        BAD_REQUEST
      );
    }

    const thread = await ct(title, metadata);
    return c.json(thread, CREATED);
  } catch (error) {
    return c.json({ message: (error as Error).message }, INTERNAL_SERVER_ERROR);
  }
};

export const getThreads: AppRouteHandler<GetThreadsRoute> = async (
  c: Context
) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    const threads = await getAllThreads(limit, offset);
    return c.json(threads, OK);
  } catch (error) {
    return c.json({ message: (error as Error).message }, INTERNAL_SERVER_ERROR);
  }
};

export const getOneThread: AppRouteHandler<GetOneThreadRoute> = async (
  c: Context
) => {
  try {
    const threadId = c.req.param('id');
    const thread = await getThread(threadId);

    if (!thread) {
      return c.json(
        { message: 'Thread not found', code: NOT_FOUND },
        NOT_FOUND
      );
    }

    return c.json(thread, OK);
  } catch (error) {
    return c.json({ message: (error as Error).message }, INTERNAL_SERVER_ERROR);
  }
};

export const deleteOneThread: AppRouteHandler<DeleteOneThread> = async (
  c: Context
) => {
  try {
    const threadId = c.req.param('id');
    await deleteThread(threadId);

    return c.json({ success: true }, OK);
  } catch (error) {
    return c.json({ message: (error as Error).message }, INTERNAL_SERVER_ERROR);
  }
};
