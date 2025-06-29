import { randomUUID } from 'crypto';
import { relations } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import z from 'zod';
import { fileExtensions } from '../../lib/constants';
import { selectUserSchema, users } from './user.schema';

export const files = sqliteTable('files', {
  id: text('id', { mode: 'text' }).primaryKey().default(randomUUID()).notNull(),
  filename: text('filename', { mode: 'text' }).unique().notNull(),
  extension: text('extension', {
    mode: 'text',
    enum: fileExtensions
  }).notNull(),
  original_path: text('original_path', { mode: 'text' }).notNull(),
  upload_path: text('upload_path', { mode: 'text' }).notNull(),
  vector_store_path: text('vector_store_path', { mode: 'text' }),
  size: text('size', { mode: 'text' }).notNull(),
  batch_id: text('batch_id', { mode: 'text' }).unique().notNull(),
  owner_id: text('owner_id', { mode: 'text' }).notNull(),
  access_level: text('access_level', {
    mode: 'text',
    enum: ['user', 'admin', 'superadmin']
  }).default('user'),
  upload_status: text('upload_status', {
    mode: 'text',
    enum: ['uploading', 'completed', 'failed']
  })
    .notNull()
    .default('uploading'),
  vector_status: text('vector_status', {
    mode: 'text',
    enum: ['processing', 'completed', 'failed']
  }),
  created_at: text('created_at').notNull().default(new Date().toISOString()),
  upload_completed_at: text('upload_completed_at', { mode: 'text' }).default(
    ''
  ),
  vector_completed_at: text('vector_completed_at', { mode: 'text' }).default('')
});

export const fileRelations = relations(files, ({ one }) => ({
  owner: one(users, {
    fields: [files.owner_id],
    references: [users.id]
  })
}));

export const insertFileSchema = z.object({
  filename: z.string(),
  extension: z.string(),
  original_path: z.string(),
  size: z.string(),
  batch_id: z.string(),
  access_level: z.enum(['user', 'admin', 'superadmin'])
});

export const selectFileSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  extension: z.string(),
  original_path: z.string(),
  upload_path: z.string(),
  size: z.string(),
  batch_id: z.string(),
  owner_id: z.string(),
  access_level: z.enum(['user', 'admin', 'superadmin']),
  upload_status: z.enum(['uploading', 'completed', 'failed']),
  vector_status: z.enum(['processing', 'completed', 'failed']).optional(),
  upload_completed_at: z.string(),
  vector_completed_at: z.string(),
  owner: selectUserSchema.optional(),
  created_at: z.string()
});
