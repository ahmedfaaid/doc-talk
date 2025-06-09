import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { chat, indexDirectory, retrieveIndexedDirectory } from './controllers';
import { createThread, getOneThread, getThreads } from './controllers/thread';

const app = new Hono();

app.use(logger());
app.use('/*', cors());

app.get('/status', c => {
  return c.json({ message: 'ok' }, 200);
});

app.post('/index-directory', indexDirectory);
app.post('/chat', chat);
app.get('/retrieve-directory', retrieveIndexedDirectory);
app.post('/threads', createThread);
app.get('/threads', getThreads);
app.get('/threads/:id', getOneThread);

export default {
  port: 5155,
  fetch: app.fetch
};
