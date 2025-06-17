import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as directory from './schema/directory';
import * as message from './schema/message';
import * as thread from './schema/thread';
import * as user from './schema/user';

const sqlite = new Database(process.env.DB_FILE_NAME!);
export const db = drizzle({
  client: sqlite,
  schema: { ...directory, ...message, ...thread, ...user }
});
