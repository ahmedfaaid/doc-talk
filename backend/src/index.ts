import { serve } from '@hono/node-server';
import app from './app.js';

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

console.log('🏛️  Legal RAG API Server');
console.log('========================');
console.log(`🚀 Server starting on port ${port}`);
console.log(`📍 Health check: http://localhost:${port}/health`);
console.log(`🔍 Legal analysis: http://localhost:${port}/api/legal/analyze`);
console.log(`📄 Document processing: http://localhost:${port}/api/legal/process-document`);
console.log(`🧠 Legal reasoning: http://localhost:${port}/api/legal/reason`);
console.log('========================\n');

serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`✅ Legal RAG API Server is running on http://localhost:${info.port}`);
});