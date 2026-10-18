// Make the demo stories in public/demo/ by calling a running VisitBridge
// server (npm run local). Each demo gets story.json plus a picture, a voice
// clip, and (if the server has FAL_KEY) a video clip for every page.
// Files that already exist are kept, so it is safe to run again.
//
//   npm run demo                      all demos
//   npm run demo -- --only=haircut    one demo
//   npm run demo -- --no-video        skip video
//   npm run demo -- --new-story       write the story text again
//   npm run demo -- --redo=video      make one kind of file again (image, voice, video)

import { mkdir, readFile, writeFile, readdir, access, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import ffmpeg from 'ffmpeg-static';

const SERVER = process.env.VB_URL || 'http://localhost:8787';
const OUT = new URL('../public/demo/', import.meta.url).pathname;

const KID = {
  name: 'Leo',
  age: '3-5',
  look: { style: 'real', skin: 'medium', hair: 'curly', hairColor: 'black', glasses: false },
};

const COMMON = {
  lang: 'en',
  age: KID.age,
  comfort: 'blue blanket',
  sensory: ['Loud sounds', 'Being touched'],
  helps: ['Show me the tools before you use them', 'Let me hold my comfort item', 'Tell me before you touch me'],
};

// The visits autistic kids find hardest.
const DEMOS = [
  { id: 'haircut', label: 'Haircut', visitType: 'Getting a haircut', theme: 'Lawn mowers',
    fears: ['noise', 'touch'], fearText: 'he cries when the clippers buzz near his ears' },
  { id: 'dentist', label: 'Dentist', visitType: 'Dental cleaning', theme: 'Lawn mowers', fears: ['mouth', 'lights'] },
  { id: 'shot', label: 'Shot', visitType: 'Vaccine or shot', theme: 'Dinosaurs', fears: ['needle', 'held'] },
  { id: 'blood-test', label: 'Blood test', visitType: 'Blood test', theme: 'Space rockets', fears: ['needle', 'away'] },
];

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const only = args.only ? String(args.only).split(',') : null;
const redo = args.redo ? String(args.redo).split(',') : [];

const health = await fetch(`${SERVER}/api/health`).then((r) => r.json()).catch(() => null);
if (!health?.ai) {
  console.error(`No AI at ${SERVER}. Start it with: npm run local`);
  process.exit(1);
}
const withVideo = health.video && !args['no-video'];
if (!health.video && !args['no-video']) console.log('No FAL_KEY on the server, so no video this time. Pictures and voice only.');

for (const demo of DEMOS.filter((d) => !only || only.includes(d.id))) {
  try {
    await makeDemo(demo);
  } catch (err) {
    console.error(`✗ ${demo.id}: ${err.message}`);
    if (/limit/i.test(err.message)) break;
  }
}
await writeIndex();

async function makeDemo(demo) {
  const dir = join(OUT, demo.id);
  await mkdir(dir, { recursive: true });
  const file = join(dir, 'story.json');
  console.log(`\n● ${demo.label}`);

  let story = !args['new-story'] && (await readJson(file));
  if (!story) {
    console.log('  writing the story…');
    const { theme, visitType, fears, fearText } = demo;
    const raw = await post('/api/story', { ...COMMON, visitType, theme, fears, fearText, favorite: theme.toLowerCase() });
    if (raw.sample) throw new Error('Got the sample story back, the AI is off');
    story = {
      title: fill(raw.title),
      label: demo.label,
      kidName: KID.name,
      age: KID.age,
      lang: 'en',
      friend: raw.friend,
      cast: raw.cast,
      plan: raw.plan,
      pages: raw.pages.map((p) => ({ ...p, say: fill(p.say) })),
    };
    await writeJson(file, story);
    for (const kind of ['jpg', 'mp3', 'mp4']) await clear(dir, kind);
  }
  for (const kind of redo) await clear(dir, { image: 'jpg', voice: 'mp3', video: 'mp4' }[kind]);
  story.pages.forEach((page, i) => { page.media = names(i); });

  await inBatches(story.pages, 3, async (page, i) => {
    const out = join(dir, page.media.image);
    if (await exists(out) || !page.scene) return;
    const res = await send('/api/picture', { scene: page.scene, friendLook: story.friend?.look, ...story.cast, kid: { ...KID.look, age: KID.age } });
    await writeFile(out, Buffer.from(await res.arrayBuffer()));
    console.log(`  picture ${i + 1}/${story.pages.length}`);
  });

  await inBatches(story.pages, 3, async (page, i) => {
    const out = join(dir, page.media.voice);
    if (await exists(out)) return;
    const res = await send('/api/voice', { text: page.say || page.text, lang: 'en', voice: 'woman' });
    await writeFile(out, Buffer.from(await res.arrayBuffer()));
    console.log(`  voice ${i + 1}/${story.pages.length}`);
  });

  if (withVideo) {
    await inBatches(story.pages, 4, async (page, i) => {
      const out = join(dir, page.media.video);
      const image = join(dir, page.media.image);
      if (await exists(out) || !(await exists(image))) return;
      const data = `data:image/jpeg;base64,${(await readFile(image)).toString('base64')}`;
      const { id } = await post('/api/video', { image: data, scene: page.scene });
      for (let tries = 0; ; tries++) {
        await new Promise((r) => setTimeout(r, 8000));
        const { status } = await post('/api/video/status', { id });
        if (status === 'done') break;
        if (tries > 90) throw new Error('video took too long');
      }
      const res = await send('/api/video/file', { id });
      const raw = `${out}.raw.mp4`;
      await writeFile(raw, Buffer.from(await res.arrayBuffer()));
      await shrink(raw, out);
      await rm(raw);
      console.log(`  video ${i + 1}/${story.pages.length}`);
    });
  }

  // Only point at files that were made.
  for (const page of story.pages) {
    for (const kind of ['image', 'voice', 'video']) {
      const name = `p${story.pages.indexOf(page) + 1}.${{ image: 'jpg', voice: 'mp3', video: 'mp4' }[kind]}`;
      if (await exists(join(dir, name))) page.media[kind] = name;
      else delete page.media[kind];
    }
  }
  await writeJson(file, story);
  console.log(`✓ ${demo.label}`);
}

async function writeIndex() {
  const list = [];
  const order = DEMOS.map((d) => d.id);
  const dirs = (await readdir(OUT).catch(() => [])).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  for (const id of dirs) {
    const story = await readJson(join(OUT, id, 'story.json'));
    if (!story) continue;
    list.push({
      id,
      title: story.title,
      label: story.label,
      friend: story.friend?.name ?? 'Ollie the Owl',
      cover: story.pages.find((p) => p.media?.image)?.media.image,
      videos: story.pages.filter((p) => p.media?.video).length,
    });
  }
  await writeJson(join(OUT, 'index.json'), list);
  console.log(`\nindex.json: ${list.map((d) => d.id).join(', ') || 'none'}`);
}

function names(i) {
  return { image: `p${i + 1}.jpg`, voice: `p${i + 1}.mp3`, video: `p${i + 1}.mp4` };
}

function fill(text = '') {
  return text.replace(/\bNAME\b/g, KID.name);
}

async function send(path, body) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${SERVER}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return res;
    const err = (await res.json().catch(() => ({}))).error || `${path} ${res.status}`;
    if (res.status === 429 || attempt >= 1) throw new Error(err);
  }
}

async function post(path, body) {
  return (await send(path, body)).json();
}

async function inBatches(items, size, task) {
  let next = 0;
  const failures = [];
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) {
      const i = next++;
      await task(items[i], i).catch((err) => failures.push(`page ${i + 1}: ${err.message}`));
    }
  }));
  if (failures.length) {
    console.log(`  ${failures.length} failed: ${failures[0]}`);
    if (failures.some((f) => /limit/i.test(f))) throw new Error(failures.find((f) => /limit/i.test(f)));
  }
}

// fal clips are about 17 MB each; this makes them a few hundred KB.
async function shrink(from, to) {
  await promisify(execFile)(ffmpeg, ['-loglevel', 'error', '-y', '-i', from, '-vf', 'scale=960:-2',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', to]);
}

async function clear(dir, ext) {
  for (const f of await readdir(dir)) if (f.endsWith(`.${ext}`)) await rm(join(dir, f));
}

async function exists(path) {
  return access(path).then(() => true, () => false);
}

async function readJson(path) {
  return readFile(path, 'utf8').then(JSON.parse, () => null);
}

async function writeJson(path, data) {
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`);
}
