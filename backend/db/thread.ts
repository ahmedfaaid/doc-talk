import { randomUUID } from 'crypto';
import { db } from '.';
import { ChatThread } from '../types';

export const createThread = (title: string, metadata?: any): ChatThread => {
  const thread: ChatThread = {
    id: randomUUID(),
    title,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: metadata ? JSON.stringify(metadata) : null
  };

  const stmt = db.prepare(`
    INSERT INTO threads (id, title, created_at, updated_at, metadata)
    VALUES (?, ?, ?, ?, ?)  
  `);

  stmt.run(
    thread.id,
    thread.title,
    thread.created_at,
    thread.updated_at,
    thread.metadata
  );
  return thread;
};

export const getThread = (threadId: string): ChatThread | null => {
  const stmt = db.prepare('SELECT * FROM threads WHERE id = ?');
  return stmt.get(threadId) as ChatThread | null;
};

export const getAllThreads = (
  limit: number = 50,
  offset: number = 0
): ChatThread[] => {
  const stmt = db.prepare(`
    SELECT * FROM threads 
    ORDER BY updated_at DESC 
    LIMIT ? OFFSET ?
  `);
  return stmt.all(limit, offset) as ChatThread[];
};

export const updateThread = (
  threadId: string,
  updates: Partial<Pick<ChatThread, 'title' | 'metadata'>>
) => {
  const fields = [];
  const values = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }

  if (updates.metadata !== undefined) {
    fields.push('metadata = ?');
    values.push(
      typeof updates.metadata === 'string'
        ? updates.metadata
        : JSON.stringify(updates.metadata)
    );
  }

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(threadId);

  const stmt = db.prepare(`
      UPDATE threads 
      SET ${fields.join(', ')} 
      WHERE id = ?
    `);

  return stmt.run(...values);
};

export const deleteThread = (threadId: string) => {
  const stmt = db.prepare('DELETE FROM threads WHERE id = ?');
  return stmt.run(threadId);
};
