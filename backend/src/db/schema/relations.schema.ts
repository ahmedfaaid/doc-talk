import { relations } from 'drizzle-orm';
import { directories } from './directory.schema';
import { files } from './file.schema';
import { users } from './user.schema';

export const directoryRelations = relations(directories, ({ one }) => ({
  owner: one(users, {
    fields: [directories.ownerId],
    references: [users.id]
  })
}));

export const fileRelations = relations(files, ({ one }) => ({
  owner: one(users, {
    fields: [files.ownerId],
    references: [users.id]
  })
}));

export const userRelations = relations(users, ({ one, many }) => ({
  subs: many(users),
  parent: one(users, {
    fields: [users.parentId],
    references: [users.id]
  }),
  directories: many(directories),
  files: many(files)
}));
