import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { indexDirectory, query } from './controllers/directory';

const app = new Hono();

app.use('/*', cors());

app.get('/status', c => {
  return c.json({ message: 'ok' }, 200);
});

app.post('/index-directory', indexDirectory);
app.get('/query', query);

export default {
  port: 5155,
  fetch: app.fetch
};
