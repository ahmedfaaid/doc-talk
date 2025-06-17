import { defineConfig } from 'drizzle-kit';
import env from './src/lib/env';

export default defineConfig({
  out: './src/db/migrations',
  schema: './src/db/schema',
  dialect: 'sqlite',
  dbCredentials: {
    url: env.DB_FILE_NAME
  }
});
