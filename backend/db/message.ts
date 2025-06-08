import { randomUUID } from 'crypto';
import { db } from '.';
import { ChatMessage } from '../types';
import { updateThread } from './thread';

export const addMessage = (
  threadId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: any
): ChatMessage => {
  const message: ChatMessage = {
    id: randomUUID(),
    thread_id: threadId,
    role,
    content,
    timestamp: new Date().toISOString(),
    metadata: metadata ? JSON.stringify(metadata) : null
  };

  const stmt = db.prepare(`
      INSERT INTO messages (id, thread_id, role, content, timestamp, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

  stmt.run(
    message.id,
    message.thread_id,
    message.role,
    message.content,
    message.timestamp,
    message.metadata
  );

  // Update thread's updated_at timestamp
  updateThread(threadId, {});

  return message;
};

export const getMessages = (
  threadId: string,
  limit: number = 100,
  offset: number = 0
): ChatMessage[] => {
  const stmt = db.prepare(`
      SELECT * FROM messages 
      WHERE thread_id = ? 
      ORDER BY timestamp ASC 
      LIMIT ? OFFSET ?
    `);
  return stmt.all(threadId, limit, offset) as ChatMessage[];
};

export const getMessageHistory = (
  threadId: string
): Array<{ role: string; content: string }> => {
  const messages = getMessages(threadId);
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
};

export const getThreadMessageCount = (threadId: string): number => {
  const stmt = db.prepare(
    'SELECT COUNT(*) as count FROM messages WHERE thread_id = ?'
  );
  const result = stmt.get(threadId) as { count: number };
  return result.count;
};

export const searchMessages = (
  query: string,
  threadId?: string
): ChatMessage[] => {
  let sql = 'SELECT * FROM messages WHERE content LIKE ?';
  const params: any[] = [`%${query}%`];

  if (threadId) {
    sql += ' AND thread_id = ?';
    params.push(threadId);
  }

  sql += ' ORDER BY timestamp DESC LIMIT 50';

  const stmt = db.prepare(sql);
  return stmt.all(...params) as ChatMessage[];
};
