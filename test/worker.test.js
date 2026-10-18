import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';

const env = { MOCK_AI: '1' };

function post(path, { origin, body = '{}', headers = {} } = {}) {
  return new Request(`https://visitbridge.example${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(origin && { origin }), ...headers },
    body,
  });
}

test('blocks calls from other websites', async () => {
  const res = await worker.fetch(post('/api/picture', { origin: 'https://evil.example' }), env);
  assert.equal(res.status, 403);
});

test('rejects bodies that are too big before reading them', async () => {
  const res = await worker.fetch(post('/api/story', { headers: { 'content-length': String(5 * 1024 * 1024) } }), env);
  assert.equal(res.status, 413);
});

test('rate limit turns away a visitor over the cap', async () => {
  const limited = { ...env, LIMITER: { limit: async () => ({ success: false }) } };
  const res = await worker.fetch(post('/api/story', { origin: 'https://visitbridge.example' }), limited);
  assert.equal(res.status, 429);
});

test('only POST reaches the API', async () => {
  const res = await worker.fetch(new Request('https://visitbridge.example/api/story'), env);
  assert.equal(res.status, 405);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
});

test('health says which features are on without exposing keys', async () => {
  const res = await worker.fetch(new Request('https://visitbridge.example/api/health'), { FAL_KEY: 'secret' });
  const body = await res.json();
  assert.equal(body.video, true);
  assert.ok(!JSON.stringify(body).includes('secret'));
});
