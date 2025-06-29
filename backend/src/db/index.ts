import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import env from '../lib/env';
import * as directory from './schema/directory.schema';
import * as file from './schema/file.schema';
import * as message from './schema/message.schema';
import * as thread from './schema/thread.schema';
import * as user from './schema/user.schema';

const sqlite = new Database(env.DB_FILE_NAME);
export const db = drizzle({
  client: sqlite,
  schema: { ...directory, ...message, ...thread, ...user, ...file }
});
