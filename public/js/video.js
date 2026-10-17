// Turn a page's picture into a short real-looking video clip (fal.ai on the worker).
// Clips take a minute or more, so this starts the job and checks back.
import { getArtBlob, getVideo, saveVideo, videoKey } from './art.js';

const CHECK_EVERY = 6000;
const GIVE_UP_AFTER = 10 * 60 * 1000;
const PARALLEL = 4;
const jobs = new Map();
let running = 0;
const waiting = [];

export { getVideo };

export function isMaking(story, index) {
  return jobs.has(videoKey(story, index));
}

// onStatus('waiting' | 'making' | 'done' | 'failed')
export function makeVideo(story, index, onStatus = () => {}) {
  const key = videoKey(story, index);
  if (jobs.has(key)) return jobs.get(key);
  const job = slot(() => run(story, index, onStatus))
    .catch(() => {
      onStatus('failed');
      return null;
    })
    .finally(() => jobs.delete(key));
  jobs.set(key, job);
  onStatus('waiting');
  return job;
}

async function run(story, index, onStatus) {
  const have = await getVideo(story, index);
  if (have) return have;
  const page = story.pages[index];
  const image = page.photo || (await toDataUrl(await getArtBlob(story, index)));
  if (!image) throw new Error('No picture yet');

  const { id } = await call('/api/video', { image, scene: page.scene });
  const began = Date.now();
  for (;;) {
    await new Promise((r) => setTimeout(r, CHECK_EVERY));
    const { status } = await call('/api/video/status', { id });
    onStatus(status);
    if (status === 'done') break;
    if (Date.now() - began > GIVE_UP_AFTER) throw new Error('Took too long');
  }
  const res = await fetch('/api/video/file', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Could not get the clip');
  const url = await saveVideo(story, index, await res.blob());
  onStatus('done');
  return url;
}

async function call(path, data) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Video failed');
  return body;
}

function toDataUrl(blob) {
  if (!blob) return null;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function slot(task) {
  return new Promise((resolve, reject) => {
    waiting.push(() => task().then(resolve, reject).finally(() => {
      running--;
      next();
    }));
    next();
  });
}

function next() {
  while (running < PARALLEL && waiting.length) {
    running++;
    waiting.shift()();
  }
}
