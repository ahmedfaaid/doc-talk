import { randomUUID } from 'crypto';
import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import z from 'zod';
import { threads } from './thread.schema';

export const messages = sqliteTable(
  'messages',
  {
    id: text('id', { mode: 'text' })
      .primaryKey()
      .default(randomUUID())
      .notNull(),
    threadId: text('thread_id', { mode: 'text' })
      .notNull()
      .references(() => threads.id, { onDelete: 'cascade' }),
    role: text('role', {
      mode: 'text',
      enum: ['user', 'assistant', 'system']
    }).notNull(),
    content: text('content', { mode: 'text' }).notNull(),
    timestamp: text('timestamp', { mode: 'text' })
      .notNull()
      .default(new Date().toISOString()),
    metadata: text('metadata', { mode: 'text' }).default('{}')
  },
  table => [
    index('idx_messages_thread_id').on(table.threadId),
    index('idx_messages_timestamp').on(table.timestamp)
  ]
);

export const insertMessageSchema = z.object({
  threadId: z.string().uuid(),
  fileId: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  title: z.string().optional(),
  content: z.string()
});

export const selectMessageSchema = z.object({
  id: z.string().uuid(),
  threadId: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.string(),
  metadata: z.string().nullable()
});
