import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import env from '../lib/env.js';
import * as file from './schema/file.schema.js';
import * as message from './schema/message.schema.js';
import * as relations from './schema/relations.schema.js';
import * as thread from './schema/thread.schema.js';
import * as user from './schema/user.schema.js';

const sqlite = new Database(env.DB_FILE_NAME);
export const db = drizzle(sqlite, {
  schema: {
    ...message,
    ...thread,
    ...user,
    ...file,
    ...relations
  }
});
