import { serve } from '@hono/node-server';
import app from './app.js';
import env from './env.js';

console.log('🚀 Starting Doc-Talk Server...');

const port = env.PORT || 5155;

serve({
  fetch: app.fetch,
  port: port
}, (info) => {
  console.log(`✅ Server is running on http://localhost:${info.port}`);
  console.log(`📚 API Documentation: http://localhost:${info.port}/doc`);
  console.log(`🔍 Environment: ${env.NODE_ENV}`);
});
