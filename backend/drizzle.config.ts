import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './db/migrations',
  schema: './db/schema',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DB_FILE_NAME!
  }
});
