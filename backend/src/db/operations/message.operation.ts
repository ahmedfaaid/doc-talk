import { randomUUID } from 'crypto';
import { and, desc, eq, like } from 'drizzle-orm';
import { db } from '..';
import { ChatMessage } from '../../types';
import { messages } from '../schema/message.schema';
import { updateThread } from './thread.operation';

export const addMessage = async (
  threadId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: any
): Promise<ChatMessage> => {
  const message: ChatMessage = {
    id: randomUUID(),
    thread_id: threadId,
    role,
    content,
    timestamp: new Date().toISOString(),
    metadata: metadata ? JSON.stringify(metadata) : null
  };

  await db.insert(messages).values(message);

  // Update thread's updated_at timestamp
  updateThread(threadId, {});

  return message;
};

export const getMessages = async (
  threadId: string,
  limit: number = 100,
  offset: number = 0
): Promise<ChatMessage[]> => {
  const messages = await db.query.messages.findMany({
    where: (table, { eq }) => eq(table.thread_id, threadId),
    orderBy: (table, { desc }) => [desc(table.timestamp)],
    limit,
    offset
  });

  return messages as ChatMessage[];
};

export const getMessageHistory = async (
  threadId: string
): Promise<Array<{ role: string; content: string }>> => {
  const messages = await getMessages(threadId);

  return messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
};

export const getThreadMessageCount = async (
  threadId: string
): Promise<number> => {
  const threadMessageCount = await db.$count(
    messages,
    eq(messages.thread_id, threadId)
  );

  return threadMessageCount || (0 as number);
};

export const searchMessages = async (
  query: string,
  threadId?: string
): Promise<ChatMessage[]> => {
  const search = await db.query.messages.findMany({
    where: and(
      threadId ? eq(messages.thread_id, threadId) : undefined,
      like(messages.content, query)
    ),
    orderBy: [desc(messages.timestamp)],
    limit: 50
  });

  return search as ChatMessage[];
};
