// AI illustrations for story pages. Drawn on demand, shrunk, and kept in
// IndexedDB on this device (they are too big for localStorage).

const DB_NAME = 'visitbridge';
const STORE = 'art';
const WIDTH = 900;
const PARALLEL = 3;

const urls = new Map();
const pending = new Map();
const failed = new Set();
let queue = [];
let running = 0;

function db() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const conn = await db();
  return new Promise((resolve, reject) => {
    const t = conn.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(req?.result);
    t.onerror = () => reject(t.error);
  });
}

export function artKey(story, index) {
  return `${story.id || 'sample'}:${index}:${story.pages[index].artVersion || 0}`;
}

// Demo stories ship their pictures, clips, and voice as files under /demo/.
export function demoFile(story, index, kind) {
  const file = story.demo && story.pages[index]?.media?.[kind];
  return file ? `${story.base}${file}` : null;
}

export async function getArt(story, index) {
  if (story.demo) return demoFile(story, index, 'image');
  const key = artKey(story, index);
  if (urls.has(key)) return urls.get(key);
  const blob = await tx('readonly', (s) => s.get(key)).catch(() => null);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urls.set(key, url);
  return url;
}

export async function getArtBlob(story, index) {
  return tx('readonly', (s) => s.get(artKey(story, index))).catch(() => null);
}

/* Video clips, stored next to the picture they were made from */

export function videoKey(story, index) {
  return `${artKey(story, index)}:video${story.pages[index].videoVersion || 0}`;
}

export async function getVideo(story, index) {
  if (story.demo) return demoFile(story, index, 'video');
  const key = videoKey(story, index);
  if (urls.has(key)) return urls.get(key);
  const blob = await tx('readonly', (s) => s.get(key)).catch(() => null);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urls.set(key, url);
  return url;
}

export async function saveVideo(story, index, blob) {
  const key = videoKey(story, index);
  await tx('readwrite', (s) => s.put(blob, key)).catch(() => {});
  const url = URL.createObjectURL(blob);
  urls.set(key, url);
  return url;
}

// Draw every page that has no picture yet. onReady(index, url) fires as each one lands.
export function drawStory(story, kid, onReady) {
  if (story.demo) return;
  story.pages.forEach((page, index) => {
    if (page.scene) drawPage(story, index, kid).then((url) => onReady(index, url));
  });
}

export function drawPage(story, index, kid) {
  const key = artKey(story, index);
  if (pending.has(key)) return pending.get(key);

  failed.delete(key);
  const job = (async () => {
    const have = await getArt(story, index);
    if (have) return have;
    const blob = await inQueue(() => fetchArt(story, index, kid));
    if (!blob) {
      failed.add(key);
      return null;
    }
    await tx('readwrite', (s) => s.put(blob, key)).catch(() => {});
    const url = URL.createObjectURL(blob);
    urls.set(key, url);
    return url;
  })();
  pending.set(key, job);
  job.finally(() => pending.delete(key));
  return job;
}

export function isDrawing(story, index) {
  return pending.has(artKey(story, index));
}

// True when a page should show the drawing placeholder.
export function wantsArt(story, index) {
  const page = story.pages[index];
  return Boolean(!story.demo && page.scene && !page.noArt && !failed.has(artKey(story, index)));
}

export async function deleteStoryArt(id) {
  await tx('readwrite', (s) => s.delete(IDBKeyRange.bound(`${id}:`, `${id}:\uffff`))).catch(() => {});
}

export async function deleteAllArt() {
  await tx('readwrite', (s) => s.clear()).catch(() => {});
}

function inQueue(task) {
  return new Promise((resolve) => {
    queue.push(async () => {
      try {
        resolve(await task());
      } catch {
        resolve(null);
      }
    });
    pump();
  });
}

function pump() {
  while (running < PARALLEL && queue.length) {
    const task = queue.shift();
    running++;
    task().finally(() => {
      running--;
      pump();
    });
  }
}

async function fetchArt(story, index, kid) {
  const res = await fetch('/api/picture', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      scene: story.pages[index].scene,
      friendLook: story.friend?.look,
      ...story.cast,
      kid: { ...kid.look, age: kid.age },
    }),
  });
  if (!res.ok) return null;
  return shrink(await res.blob());
}

async function shrink(blob) {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, WIDTH / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
}
