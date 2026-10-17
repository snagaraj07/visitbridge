// Local dev server for machines that can't run workerd (macOS < 13.5).
// Runs the same Worker code and calls Workers AI through the REST API.
//   npm run local   (reads CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID from .env)

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import worker from '../src/worker.js';

const PORT = Number(process.env.PORT) || 8787;
const PUBLIC = new URL('../public/', import.meta.url).pathname;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.json': 'application/json',
};

const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account, MOCK_AI, FAL_KEY, ELEVENLABS_API_KEY } = process.env;

const env = {
  MOCK_AI,
  FAL_KEY,
  ELEVENLABS_API_KEY,
  ASSETS: { fetch: serveStatic },
  AI: token && account ? { run: runRemote } : undefined,
};

async function runRemote(model, input, options = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (options.returnRawResponse) return res;
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.errors?.map((e) => e.message).join('; ') || `Workers AI ${res.status}`);
  }
  return body.result;
}

async function serveStatic(request) {
  const { pathname } = new URL(request.url);
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(PUBLIC, safe.endsWith('/') ? `${safe}index.html` : safe);
  let body;
  try {
    body = await readFile(file);
  } catch {
    file = join(PUBLIC, 'index.html');
    body = await readFile(file);
  }
  return new Response(body, { headers: { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' } });
}

http
  .createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const request = new Request(`http://${req.headers.host}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
    });
    const response = await worker.fetch(request, env);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  })
  .listen(PORT, '127.0.0.1', () => {
    const mode = env.AI && MOCK_AI !== '1' ? 'Workers AI' : 'sample answers (no Cloudflare keys found)';
    console.log(`VisitBridge running at http://localhost:${PORT} using ${mode}`);
  });
