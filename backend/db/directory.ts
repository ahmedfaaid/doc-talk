import { randomUUID } from 'crypto';
import { db } from '.';
import { Directory } from '../types';

export const addDirectory = (
  path: string,
  name: string,
  vector_path: string,
  indexed: boolean
): Directory => {
  const directory: Directory = {
    id: randomUUID(),
    name,
    directory_path: path,
    vector_path,
    indexed,
    created_at: new Date().toISOString()
  };

  const stmt = db.prepare(`
    INSERT INTO directories (id, name, directory_path, vector_path, indexed, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    directory.id,
    directory.name,
    directory.directory_path,
    directory.vector_path,
    directory.indexed,
    directory.created_at
  );

  return directory;
};

export const getDirectory = (path: string): Directory | null => {
  const stmt = db.prepare('SELECT * FROM directories WHERE directory_path = ?');
  return stmt.get(path) as Directory | null;
};
