import { randomUUID } from 'crypto';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { z } from 'zod';

export const directories = sqliteTable('directories', {
  id: text('id', { mode: 'text' }).primaryKey().default(randomUUID()).notNull(),
  name: text('name', { mode: 'text' }).notNull().unique(),
  directory_path: text('directory_path', { mode: 'text' }).notNull().unique(),
  vector_path: text('vector_path', { mode: 'text' }).notNull().unique(),
  indexed: integer('indexed', { mode: 'boolean' }).notNull().default(false),
  created_at: text('created_at').notNull().default(new Date().toISOString())
});

export const insertDirectorySchema = z.object({
  name: z.string(),
  directory_path: z.string()
});

export const selectDirectorySchema = z.object({
  id: z.string(),
  name: z.string(),
  directory_path: z.string(),
  vector_path: z.string(),
  indexed: z.boolean(),
  created_at: z.string()
});
