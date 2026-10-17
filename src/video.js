import { InputError } from './ai.js';

// Real-looking video clips from a page's picture, through fal.ai.
// A clip takes a minute or more, so the page starts it, then checks back.
const APP = 'fal-ai/kling-video';
const MODEL = `${APP}/v2.1/standard/image-to-video`;
const QUEUE = 'https://queue.fal.run';
const REQUEST_ID = /^[0-9a-f-]{36}$/;
const IMAGE_MAX = 1_500_000;

const MOTION = 'Real-life live-action footage, like a gentle family movie. Natural, slow, small movements: '
  + 'the child and the friend breathe, blink, smile, and move a little. The friend copies what the child does. '
  + 'Steady camera with a slow push-in. Calm and warm. Nothing sudden or scary.';
const AVOID = 'blur, distortion, extra limbs, warped faces, text, watermark, fast motion, scary, blood, needle in skin, nudity';

function falKey(env) {
  if (!env.FAL_KEY) throw new InputError('Video is not set up on this server.');
  return env.FAL_KEY;
}

const auth = (env) => ({ authorization: `Key ${falKey(env)}` });

export async function startVideo(env, body) {
  const image = typeof body.image === 'string' ? body.image : '';
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(image)) throw new InputError('Missing picture.');
  if (image.length > IMAGE_MAX) throw new InputError('Picture is too big.');
  const scene = typeof body.scene === 'string' ? body.scene.replace(/\s+/g, ' ').trim().slice(0, 400) : '';

  const res = await fetch(`${QUEUE}/${MODEL}`, {
    method: 'POST',
    headers: { ...auth(env), 'content-type': 'application/json' },
    body: JSON.stringify({
      prompt: [scene, MOTION].filter(Boolean).join(' '),
      negative_prompt: AVOID,
      image_url: image,
      duration: '5',
      cfg_scale: 0.5,
    }),
  });
  if (!res.ok) throw new Error(`fal ${res.status}`);
  const { request_id: id } = await res.json();
  return json({ id });
}

export async function videoStatus(env, body) {
  const id = checkId(body.id);
  const res = await fetch(`${QUEUE}/${APP}/requests/${id}/status`, { headers: auth(env) });
  if (!res.ok) throw new Error(`fal ${res.status}`);
  const { status } = await res.json();
  return json({ status: status === 'COMPLETED' ? 'done' : status === 'IN_PROGRESS' ? 'making' : 'waiting' });
}

// Stream the finished clip through the worker so the key and the fal URL stay here.
export async function videoFile(env, body) {
  const id = checkId(body.id);
  const res = await fetch(`${QUEUE}/${APP}/requests/${id}`, { headers: auth(env) });
  if (!res.ok) throw new Error(`fal ${res.status}`);
  const url = (await res.json())?.video?.url;
  if (!url || !/^https:\/\/[a-z0-9.-]+\.fal\.(media|ai)\//.test(url)) throw new Error('No video returned');
  const clip = await fetch(url);
  if (!clip.ok) throw new Error(`fal media ${clip.status}`);
  return new Response(clip.body, { headers: { 'content-type': 'video/mp4', 'cache-control': 'no-store' } });
}

function checkId(id) {
  if (typeof id !== 'string' || !REQUEST_ID.test(id)) throw new InputError('Bad video id.');
  return id;
}

function json(data) {
  return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}
