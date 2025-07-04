import { relations } from 'drizzle-orm';
import { files } from './file.schema';
import { users } from './user.schema';

export const fileRelations = relations(files, ({ one }) => ({
  owner: one(users, {
    fields: [files.ownerId],
    references: [users.id]
  })
}));

export const userRelations = relations(users, ({ one, many }) => ({
  subs: many(users, { relationName: 'parent_user' }),
  parent: one(users, {
    fields: [users.parentId],
    references: [users.id],
    relationName: 'parent_user'
  }),
  files: many(files)
}));
