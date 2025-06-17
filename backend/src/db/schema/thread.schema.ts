import { randomUUID } from 'crypto';
import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const threads = sqliteTable(
  'threads',
  {
    id: text('id', { mode: 'text' })
      .primaryKey()
      .default(randomUUID())
      .notNull(),
    title: text('title', { mode: 'text' }).notNull(),
    metadata: text('metadata', { mode: 'text' }).default('{}'),
    created_at: text('created_at', { mode: 'text' })
      .notNull()
      .default(new Date().toISOString()),
    updated_at: text('updated_at', { mode: 'text' })
      .notNull()
      .default(new Date().toISOString())
      .$onUpdate(() => new Date().toISOString())
  },
  table => [index('idx_threads_updated_at').on(table.updated_at)]
);

export const insertThreadSchema = createInsertSchema(threads).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const selectThreadSchema = createSelectSchema(threads);
