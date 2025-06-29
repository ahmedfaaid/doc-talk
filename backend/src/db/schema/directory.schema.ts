import { randomUUID } from 'crypto';
import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { z } from 'zod';
import { users } from './user.schema';

export const directories = sqliteTable('directories', {
  id: text('id', { mode: 'text' }).primaryKey().default(randomUUID()).notNull(),
  name: text('name', { mode: 'text' }).notNull().unique(),
  directoryPath: text('directory_path', { mode: 'text' }).notNull().unique(),
  vectorPath: text('vector_path', { mode: 'text' }).notNull().unique(),
  indexed: integer('indexed', { mode: 'boolean' }).notNull().default(false),
  ownerId: text('owner_id', { mode: 'text' }).notNull(),
  accessLevel: text('access_level', {
    mode: 'text',
    enum: ['user', 'admin', 'superadmin']
  }),
  createdAt: text('created_at').notNull().default(new Date().toISOString())
});

export const directoryRelations = relations(directories, ({ one }) => ({
  owner: one(users, {
    fields: [directories.ownerId],
    references: [users.id]
  })
}));

export const insertDirectorySchema = z.object({
  name: z.string(),
  directoryPath: z.string()
});

export const selectDirectorySchema = z.object({
  id: z.string(),
  name: z.string(),
  directoryPath: z.string(),
  vectorPath: z.string(),
  indexed: z.boolean(),
  createdAt: z.string()
});
