import { randomUUID } from 'crypto';
import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { directories } from './directory.schema';

export const users = sqliteTable('users', {
  id: text('id', { mode: 'text' }).primaryKey().default(randomUUID()).notNull(),
  email: text('email', { mode: 'text' }).notNull(),
  password: text('password', { mode: 'text' }).notNull(),
  first_name: text('first_name', { mode: 'text' }).notNull(),
  last_name: text('last_name', { mode: 'text' }).notNull(),
  company: text('company', { mode: 'text' }),
  is_company: integer('is_company', { mode: 'boolean' })
    .notNull()
    .default(false),
  role: text('role', {
    mode: 'text',
    enum: ['user', 'admin', 'superadmin']
  })
    .notNull()
    .default('user'),
  parent_id: text('parent_id', { mode: 'text' }),
  created_at: text('created_at', { mode: 'text' })
    .notNull()
    .default(new Date().toISOString()),
  updated_at: text('updated_at', { mode: 'text' })
    .notNull()
    .default(new Date().toISOString())
    .$onUpdate(() => new Date().toISOString())
});

export const userRelations = relations(users, ({ one, many }) => ({
  subs: many(users),
  parent: one(users, {
    fields: [users.parent_id],
    references: [users.id]
  }),
  directories: many(directories)
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const selectUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  company: z.string().nullable(),
  is_company: z.boolean(),
  role: z.enum(['user', 'admin', 'superadmin']),
  parent_id: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export const updateUserSchema = z
  .object({
    email: z.string().email().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    company: z.string().optional(),
    is_company: z.boolean().optional(),
    role: z.enum(['user', 'admin', 'superadmin']).optional()
  })
  .strict();

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const registerSchema = z.object({
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  company: z.string().nullable(),
  is_company: z.boolean().default(false),
  role: z.enum(['user', 'admin', 'superadmin']).default('superadmin'),
  parent_id: z.string().uuid().nullable().default(null)
});

export const authSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email()
  })
});
