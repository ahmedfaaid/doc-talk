import { randomUUID } from 'crypto';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const directories = sqliteTable('directories', {
  id: text('id', { mode: 'text' }).primaryKey().default(randomUUID()).notNull(),
  name: text('name', { mode: 'text' }).notNull().unique(),
  directory_path: text('directory_path', { mode: 'text' }).notNull().unique(),
  vector_path: text('vector_path', { mode: 'text' }).notNull().unique(),
  indexed: text('indexed').notNull().default('0'),
  created_at: text('created_at').notNull().default(new Date().toISOString())
});
