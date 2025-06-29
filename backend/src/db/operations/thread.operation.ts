import { randomUUID } from 'crypto';
import { desc, eq } from 'drizzle-orm';
import { db } from '..';
import { ChatThread } from '../../types';
import { threads } from '../schema/thread.schema';

export const createThread = async (
  title: string,
  metadata?: any
): Promise<ChatThread> => {
  const thread: ChatThread = {
    id: randomUUID(),
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: metadata ? JSON.stringify(metadata) : null
  };

  await db.insert(threads).values(thread);

  return thread;
};

export const getThread = async (
  threadId: string
): Promise<ChatThread | null> => {
  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId)
  });

  return thread as ChatThread | null;
};

export const getAllThreads = async (
  limit: number = 50,
  offset: number = 0
): Promise<ChatThread[]> => {
  const allThreads = await db.query.threads.findMany({
    orderBy: [desc(threads.updatedAt)],
    limit,
    offset
  });

  return allThreads as ChatThread[];
};

export const updateThread = async (
  threadId: string,
  updates: Partial<Pick<ChatThread, 'title' | 'metadata'>>
): Promise<ChatThread> => {
  const [update] = await db
    .update(threads)
    .set({
      ...(updates.title && { title: updates.title }),
      ...(updates.metadata && {
        metadata:
          typeof updates.metadata === 'string'
            ? updates.metadata
            : JSON.stringify(updates.metadata)
      }),
      updatedAt: new Date().toISOString()
    })
    .where(eq(threads.id, threadId))
    .returning();

  return update;
};

export const deleteThread = async (threadId: string): Promise<void> => {
  await db.delete(threads).where(eq(threads.id, threadId)).returning();
};
