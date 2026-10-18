import { writeStory, InputError } from './ai.js';
import { drawPicture, speakText, cloneVoice, deleteVoice } from './media.js';
import { startVideo, videoStatus, videoFile } from './video.js';
import { sampleStory } from './samples.js';

// needs: which service the route uses, so a missing key turns off only that feature.
const ROUTES = {
  '/api/story': { run: async (env, body) => json(await writeStory(env, body)) },
  '/api/picture': { run: drawPicture, needs: 'ai' },
  '/api/voice': { run: speakText, needs: (env, body) => (body.voiceId ? 'clone' : 'ai') },
  '/api/voice/clone': { run: cloneVoice, needs: 'clone', form: true },
  '/api/voice/delete': { run: deleteVoice, needs: 'clone' },
  '/api/video': { run: startVideo, needs: 'video' },
  '/api/video/status': { run: videoStatus, needs: 'video' },
  '/api/video/file': { run: videoFile, needs: 'video' },
};

const FEATURES = {
  ai: (env) => aiOn(env),
  clone: (env) => Boolean(env.ELEVENLABS_API_KEY),
  video: (env) => Boolean(env.FAL_KEY),
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    if (url.pathname === '/api/health') {
      return json({ ok: true, ...Object.fromEntries(Object.entries(FEATURES).map(([k, on]) => [k, on(env)])) });
    }

    const route = ROUTES[url.pathname];
    if (!route) return json({ error: 'Not found.' }, 404);
    if (request.method !== 'POST') return json({ error: 'Use POST.' }, 405);
    if (!sameSite(request, url)) return json({ error: 'Not allowed.' }, 403);
    if (Number(request.headers.get('content-length')) > (route.form ? FORM_MAX : JSON_MAX)) {
      return json({ error: 'Request is too big.' }, 413);
    }
    if (env.LIMITER) {
      const { success } = await env.LIMITER.limit({ key: request.headers.get('cf-connecting-ip') || 'anon' });
      if (!success) return json({ error: 'Too many requests. Please wait a minute.' }, 429);
    }

    let body = request;
    if (!route.form) {
      try {
        body = await request.json();
      } catch {
        return json({ error: 'Request body must be JSON.' }, 400);
      }
    }
    const need = typeof route.needs === 'function' ? route.needs(env, body) : route.needs;
    if (need && !FEATURES[need](env)) return json({ error: 'This feature is not set up on this server.' }, 503);

    try {
      return await route.run(env, body);
    } catch (err) {
      if (err instanceof InputError) return json({ error: err.message }, 400);
      // Never log request content, it can describe a child's needs.
      console.error('ai_error', url.pathname, err?.name, err?.message?.slice(0, 200));
      if (overLimit(err)) {
        const sample = url.pathname === '/api/story' ? { ...structuredClone(sampleStory), sample: true } : undefined;
        return json({ error: LIMIT_MESSAGE, sample }, 429);
      }
      return json({ error: 'The AI service had a problem. Please try again in a moment.' }, 502);
    }
  },
};

const LIMIT_MESSAGE = 'The AI has hit its limit for today. Please try again later, or watch the sample story.';
const JSON_MAX = 2 * 1024 * 1024;
const FORM_MAX = 11 * 1024 * 1024;

// Browsers always send Origin on POST, so this stops other sites from spending this server's AI credit.
function sameSite(request, url) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === url.host;
  } catch {
    return false;
  }
}

function overLimit(err) {
  return /daily free allocation|\b429\b|rate limit/i.test(err?.message || '');
}

function aiOn(env) {
  return Boolean(env.AI) && env.MOCK_AI !== '1';
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}
