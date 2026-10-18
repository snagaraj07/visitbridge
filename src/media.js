import { InputError } from './ai.js';

const IMAGE_MODEL = '@cf/leonardo/lucid-origin';
const VOICES = {
  en: { model: '@cf/deepgram/aura-2-en', woman: 'thalia', man: 'apollo' },
  es: { model: '@cf/deepgram/aura-2-es', woman: 'celeste', man: 'nestor' },
};
// MeloTTS covers a few more. Anything else uses the device's own voice.
const MELO = '@cf/myshell-ai/melotts';
const MELO_LANGS = { fr: 'fr', zh: 'zh', ja: 'jp', ko: 'kr' };

// Real photos help many autistic kids match the story to the real place,
// so "real" is the default. Some kids like the cartoon look better.
const STYLES = {
  real: {
    look: 'Photorealistic still from a live-action family movie. Real people with natural skin texture and real hair, '
      + 'real clothes, a real room, soft natural window light, shallow depth of field, 35mm lens, sharp focus on faces, high detail.',
    friend: (f) => `Next to the child is ${f}, a realistic CGI movie character blended into the real scene, with a friendly face and big expressive eyes.`,
  },
  movie: {
    look: 'Still from a modern high-end 3D animated feature film, like Pixar or DreamWorks. Detailed realistic textures, '
      + 'expressive faces, cinematic soft lighting, rich colors, high detail.',
    friend: (f) => `Next to the child is ${f}, an animated character with a friendly face and big expressive eyes.`,
  },
};
const SAFE = 'Warm, calm, and child-safe. The friend copies what the child is doing. Blank walls and blank signs: '
  + 'no text, no words, no letters, no logos. No blood, no scary tools. '
  + 'The friend is a brand-new original character, not from any TV show, movie, book, game, or toy brand. '
  + 'The child is fully covered at all times: clothes, pajamas, a towel wrap, or thick bubbles up to the shoulders.';
// Scenes where the image model could show too much. These get a fixed safe framing.
const PRIVATE = /\b(bath|bathtub|shower|toilet|potty|undress|naked|diaper|changing)\b/i;

// The child's look comes from fixed choices only, so nothing typed by a
// person ever reaches the image prompt except the scene the story model wrote.
const SKIN = { light: 'light', 'light-medium': 'light olive', medium: 'medium brown', 'medium-dark': 'brown', dark: 'dark brown' };
const HAIR = { short: 'short', long: 'long', curly: 'curly', braids: 'braided', buzz: 'very short buzz-cut' };
const HAIR_COLOR = { black: 'black', brown: 'brown', blonde: 'blonde', red: 'red' };
const AGE = { '3-5': '4-year-old', '6-8': '7-year-old', '9-12': '10-year-old' };

export function describeKid(look = {}) {
  const parts = [`a ${AGE[look.age] ?? '6-year-old'} child`];
  if (SKIN[look.skin]) parts.push(`with ${SKIN[look.skin]} skin`);
  if (HAIR[look.hair] || HAIR_COLOR[look.hairColor]) {
    parts.push(`and ${[HAIR[look.hair], HAIR_COLOR[look.hairColor]].filter(Boolean).join(' ')} hair`);
  }
  if (look.glasses === true) parts.push('wearing round glasses');
  return parts.join(' ');
}

export async function drawPicture(env, body) {
  const scene = text(body.scene, 400);
  if (!scene) throw new InputError('Missing scene.');
  const friend = text(body.friendLook, 160);
  // The same place, grown-up, clothes and seed on every page, so the pictures read as one film.
  const place = text(body.place, 160);
  const grownUp = text(body.grownUp, 120);
  const seed = Number.isInteger(body.seed) && body.seed >= 0 ? body.seed : undefined;
  const covered = PRIVATE.test(scene) || /\b(pajamas|bed|dress|swim)/i.test(scene);

  const style = STYLES[body.kid?.style] ?? STYLES.real;
  const kid = describeKid(body.kid);
  const placed = /\bthe child\b/i.test(scene) ? scene.replace(/\bthe child\b/i, `the small ${kid.replace(/^a /, '')}`) : `${scene} With ${kid}.`;
  const prompt = [
    style.look,
    placed,
    place && !/\bhome\b/i.test(scene) && `The place: ${place}.`,
    grownUp && /grown-?up|parent|mom|dad/i.test(scene) && `The grown-up is ${grownUp}.`,
    !covered && 'The child wears a plain green t-shirt and blue jeans.',
    'The child is small, much shorter than the grown-ups, and is the main character. Grown-ups look like adults.',
    friend && style.friend(friend),
    PRIVATE.test(scene) && 'Close-up of the face and shoulders only, the child wrapped in a big fluffy towel or under thick bubbles. Nothing below the shoulders is visible.',
    SAFE,
  ].filter(Boolean).join(' ');

  const res = await env.AI.run(IMAGE_MODEL, { prompt, width: 1024, height: 768, ...(seed !== undefined && { seed }) });
  const image = res?.image;
  if (!image) throw new Error('No image returned');
  return new Response(base64ToBytes(image), {
    headers: { 'content-type': 'image/jpeg', 'cache-control': 'no-store' },
  });
}

export async function speakText(env, body) {
  const raw = text(body.text, 500);
  if (!raw) throw new InputError('Missing text.');
  const lang = body.lang ?? 'en';

  if (body.voiceId) return speakCloned(env, body.voiceId, raw);

  const words = raw.replace(/\[[a-z ]+\]\s*/gi, '');
  if (MELO_LANGS[lang]) {
    const out = await env.AI.run(MELO, { prompt: words, lang: MELO_LANGS[lang] });
    if (typeof out?.audio !== 'string') throw new Error('No audio returned');
    return new Response(base64ToBytes(out.audio), {
      headers: { 'content-type': 'audio/mpeg', 'cache-control': 'no-store' },
    });
  }
  const voice = VOICES[lang];
  if (!voice) throw new InputError('No AI voice for this language.');

  const speaker = body.voice === 'man' ? voice.man : voice.woman;
  const res = await env.AI.run(voice.model, { text: words, speaker, encoding: 'mp3' }, { returnRawResponse: true });
  if (!res.ok) throw new Error(`Voice ${res.status}`);
  return new Response(res.body, {
    headers: { 'content-type': 'audio/mpeg', 'cache-control': 'no-store' },
  });
}

/* The parent's own voice, through ElevenLabs */

const ELEVEN = 'https://api.elevenlabs.io/v1';
const VOICE_ID = /^[A-Za-z0-9]{10,40}$/;
const SAMPLE_MAX = 10 * 1024 * 1024;

function elevenKey(env) {
  if (!env.ELEVENLABS_API_KEY) throw new InputError('Parent voice is not set up on this server.');
  return env.ELEVENLABS_API_KEY;
}

// v3 acts out cues like [giggles]. If it is not available, use v2 without them.
async function speakCloned(env, voiceId, words) {
  if (!VOICE_ID.test(voiceId)) throw new InputError('Bad voice id.');
  const key = elevenKey(env);
  const say = (model, input) => fetch(`${ELEVEN}/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({ text: input, model_id: model, voice_settings: { stability: 0.4, similarity_boost: 0.85 } }),
  });
  let res = await say('eleven_v3', words);
  if (!res.ok && res.status !== 401 && res.status !== 404) {
    res = await say('eleven_multilingual_v2', words.replace(/\[[a-z ]+\]\s*/gi, ''));
  }
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
  return new Response(res.body, { headers: { 'content-type': 'audio/mpeg', 'cache-control': 'no-store' } });
}

// The parent's recording goes to ElevenLabs once to make a voice, then is gone.
export async function cloneVoice(env, request) {
  const key = elevenKey(env);
  const form = await request.formData();
  const sample = form.get('sample');
  if (form.get('consent') !== 'yes') throw new InputError('Please tick the consent box first.');
  if (!(sample instanceof Blob) || sample.size < 20_000) throw new InputError('The recording is too short. Please read all the sentences.');
  if (sample.size > SAMPLE_MAX) throw new InputError('The recording is too long.');
  const who = form.get('who') === 'dad' ? 'Dad' : 'Mom';

  const out = new FormData();
  out.append('name', `VisitBridge ${who} ${crypto.randomUUID().slice(0, 8)}`);
  out.append('description', 'Parent voice for their child\'s visit stories. Made with consent.');
  out.append('remove_background_noise', 'true');
  out.append('files', sample, 'sample.wav');
  const res = await fetch(`${ELEVEN}/voices/add`, { method: 'POST', headers: { 'xi-api-key': key }, body: out });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
  const { voice_id: voiceId } = await res.json();
  return json({ voiceId });
}

export async function deleteVoice(env, body) {
  const key = elevenKey(env);
  if (!VOICE_ID.test(body.voiceId || '')) throw new InputError('Bad voice id.');
  const res = await fetch(`${ELEVEN}/voices/${body.voiceId}`, { method: 'DELETE', headers: { 'xi-api-key': key } });
  if (!res.ok && res.status !== 404) throw new Error(`ElevenLabs ${res.status}`);
  return json({ deleted: true });
}

function json(data) {
  return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}

function text(value, max) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function base64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
