import { randomUUID } from 'crypto';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import z from 'zod';

export const blacklist = sqliteTable('token_blacklist', {
  id: text('id', { mode: 'text' }).primaryKey().default(randomUUID()).notNull(),
  token: text('token', { mode: 'text' }).unique().notNull(),
  expiresAt: text('expires_at', { mode: 'text' }).notNull(),
  createdAt: text('created_at').notNull().default(new Date().toISOString())
});

export const insertBlacklistSchema = z.object({
  token: z.string(),
  expiresAt: z.string()
});

export const selectBlacklistSchema = z.object({
  id: z.string().uuid(),
  token: z.string(),
  expiresAt: z.string(),
  createdAt: z.string()
});
