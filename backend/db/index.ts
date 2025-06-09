import { Database } from 'bun:sqlite';

export const db = new Database('db/chat.db', { create: true });

db.query(
  `CREATE TABLE IF NOT EXISTS directories (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    directory_path TEXT NOT NULL UNIQUE,
    vector_path TEXT NOT NULL UNIQUE,
    indexed BOOLEAN NOT NULL DEFAULT 0
    created_at TEXT NOT NULL
  )`
).run();

db.query(
  `CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    metadata TEXT
  )`
).run();

db.query(
  `CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    metadata TEXT,
    FOREIGN KEY (thread_id) REFERENCES threads (id) ON DELETE CASCADE
  )`
).run();

db.query(
  `CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
  CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
  CREATE INDEX IF NOT EXISTS idx_threads_updated_at ON threads(updated_at);
  `
).run();
