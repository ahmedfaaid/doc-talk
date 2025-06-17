import { randomUUID } from 'crypto';
import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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
  })
}));
