import http from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { createBot, createModel, validateRequest } from './bot.mjs';

export function createServer({ bot, serviceToken }) {
  if (!serviceToken || serviceToken.length < 32 || serviceToken.startsWith('replace-')) {
    throw new Error('Set CHAT_SERVICE_TOKEN to a random secret of at least 32 characters');
  }
  const expected = Buffer.from(`Bearer ${serviceToken}`);
  const server = http.createServer(async (req, res) => {
    const send = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(body));
    };
    if (req.method === 'GET' && req.url === '/health') return send(200, { ok: true });
    if (req.method !== 'POST' || req.url !== '/chat') return send(404, { error: 'Not found' });
    const provided = Buffer.from(req.headers.authorization ?? '');
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return send(401, { error: 'Unauthorized' });
    }
    if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
      return send(415, { error: 'Use application/json' });
    }
    let body;
    try {
      let size = 0;
      const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 48000) return send(413, { error: 'Request too large' });
        chunks.push(chunk);
      }
      body = validateRequest(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    } catch {
      return send(400, { error: 'Send a message of 1–3000 characters and up to 10 user/assistant history messages.' });
    }
    try {
      const reply = await bot(body);
      send(reply.kind === 'unavailable' ? 503 : 200, reply);
    } catch {
      send(503, { error: 'Chat unavailable' });
    }
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const bot = createBot(createModel({ apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL }));
  const server = createServer({ bot, serviceToken: process.env.CHAT_SERVICE_TOKEN });
  const port = Number(process.env.PORT ?? 3000);
  server.listen(port, '127.0.0.1', () => console.log(`Medication chatbot: http://127.0.0.1:${port}`));
}
