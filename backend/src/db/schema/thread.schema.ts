import { randomUUID } from 'crypto';
import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { z } from 'zod';

export const threads = sqliteTable(
  'threads',
  {
    id: text('id', { mode: 'text' })
      .primaryKey()
      .default(randomUUID())
      .notNull(),
    title: text('title', { mode: 'text' }).notNull(),
    metadata: text('metadata', { mode: 'text' }).default('{}'),
    createdAt: text('created_at', { mode: 'text' })
      .notNull()
      .default(new Date().toISOString()),
    updatedAt: text('updated_at', { mode: 'text' })
      .notNull()
      .default(new Date().toISOString())
      .$onUpdate(() => new Date().toISOString())
  },
  table => [index('idx_threads_updated_at').on(table.updatedAt)]
);

export const insertThreadSchema = z.object({
  title: z.string(),
  metadata: z.any().optional()
});

export const selectThreadSchema = z.object({
  id: z.string(),
  title: z.string(),
  metadata: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});
