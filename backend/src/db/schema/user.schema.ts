import { randomUUID } from 'crypto';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const users = sqliteTable('users', {
  id: text('id', { mode: 'text' }).primaryKey().default(randomUUID()).notNull(),
  email: text('email', { mode: 'text' }).notNull(),
  password: text('password', { mode: 'text' }).notNull(),
  firstName: text('first_name', { mode: 'text' }).notNull(),
  lastName: text('last_name', { mode: 'text' }).notNull(),
  company: text('company', { mode: 'text' }),
  isCompany: integer('is_company', { mode: 'boolean' })
    .notNull()
    .default(false),
  role: text('role', {
    mode: 'text',
    enum: ['user', 'admin', 'superadmin']
  })
    .notNull()
    .default('user'),
  parentId: text('parent_id', { mode: 'text' }),
  createdAt: text('created_at', { mode: 'text' })
    .notNull()
    .default(new Date().toISOString()),
  updatedAt: text('updated_at', { mode: 'text' })
    .notNull()
    .default(new Date().toISOString())
    .$onUpdate(() => new Date().toISOString())
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const selectUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  company: z.string().nullable(),
  isCompany: z.boolean(),
  role: z.enum(['user', 'admin', 'superadmin']),
  parentId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const updateUserSchema = z
  .object({
    email: z.string().email().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    company: z.string().optional(),
    isCompany: z.boolean().optional(),
    role: z.enum(['user', 'admin', 'superadmin']).optional()
  })
  .strict();

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  company: z.string().nullable(),
  isCompany: z.boolean().default(false),
  role: z.enum(['user', 'admin', 'superadmin']).default('superadmin'),
  parentId: z.string().uuid().nullable().default(null)
});

export const authSchema = z.object({
  token: z.string(),
  user: selectUserSchema
});
