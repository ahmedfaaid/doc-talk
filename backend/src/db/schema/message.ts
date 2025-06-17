import { randomUUID } from 'crypto';
import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { threads } from './thread';

export const messages = sqliteTable(
  'messages',
  {
    id: text('id', { mode: 'text' })
      .primaryKey()
      .default(randomUUID())
      .notNull(),
    thread_id: text('thread_id', { mode: 'text' })
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
    index('idx_messages_thread_id').on(table.thread_id),
    index('idx_messages_timestamp').on(table.timestamp)
  ]
);

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true
});

export const selectMessageSchema = createSelectSchema(messages);
