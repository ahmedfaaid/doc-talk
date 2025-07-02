import { randomUUID } from 'crypto';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import z from 'zod';
import { fileExtensions } from '../../lib/constants';
import { selectUserSchema } from './user.schema';

export const files = sqliteTable('files', {
  id: text('id', { mode: 'text' }).primaryKey().default(randomUUID()).notNull(),
  filename: text('filename', { mode: 'text' }).unique().notNull(),
  extension: text('extension', {
    mode: 'text',
    enum: fileExtensions
  }).notNull(),
  originalPath: text('original_path', { mode: 'text' }).notNull(),
  uploadPath: text('upload_path', { mode: 'text' }).notNull(),
  vectorStorePath: text('vector_store_path', { mode: 'text' }),
  size: text('size', { mode: 'text' }).notNull(),
  batchId: text('batch_id', { mode: 'text' }).unique().notNull(),
  ownerId: text('owner_id', { mode: 'text' }).notNull(),
  accessLevel: text('access_level', {
    mode: 'text',
    enum: ['user', 'admin', 'superadmin']
  }).default('user'),
  uploadStatus: text('upload_status', {
    mode: 'text',
    enum: ['uploading', 'completed', 'failed']
  })
    .notNull()
    .default('uploading'),
  vectorStatus: text('vector_status', {
    mode: 'text',
    enum: ['processing', 'completed', 'failed']
  }),
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
  uploadCompletedAt: text('upload_completed_at', { mode: 'text' }).default(''),
  vectorCompletedAt: text('vector_completed_at', { mode: 'text' }).default('')
});

export const insertFileSchema = z.object({
  filename: z.string(),
  extension: z.string(),
  originalPath: z.string(),
  size: z.string(),
  batchId: z.string(),
  accessLevel: z.enum(['user', 'admin', 'superadmin'])
});

export const selectFileSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  extension: z.string(),
  originalPath: z.string(),
  uploadPath: z.string(),
  size: z.string(),
  batchId: z.string(),
  ownerId: z.string(),
  accessLevel: z.enum(['user', 'admin', 'superadmin']),
  uploadStatus: z.enum(['uploading', 'completed', 'failed']),
  vectorStatus: z.enum(['processing', 'completed', 'failed']).optional(),
  uploadCompletedAt: z.string(),
  vectorCompletedAt: z.string(),
  owner: selectUserSchema.optional(),
  createdAt: z.string()
});
