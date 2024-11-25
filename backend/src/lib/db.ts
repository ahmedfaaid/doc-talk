import { Database } from 'bun:sqlite';

export const db = new Database('db/directories.sqlite', { create: true });

db.query(
  `CREATE TABLE IF NOT EXISTS directories (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
    directory_path TEXT NOT NULL UNIQUE
    vector_path TEXT NOT NULL UNIQUE
    indexed BOOLEAN NOT NULL DEFAULT 0
)`
).run();
