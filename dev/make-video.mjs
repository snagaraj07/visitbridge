// Builds the YouTube demo video: notes/video/VisitBridge-demo.mp4
// npm run video
// Needs the local server on :8787 with an AI binding (npm run local), Google
// Chrome (or CHROME=/path/to/chrome), and the two photos in notes/gallery.
import ffmpeg from 'ffmpeg-static';
import { spawn, execFileSync, spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = `${ROOT}/notes/video`;
const APP = 'http://localhost:8787';
const DEMO = `${ROOT}/public/demo/haircut`;
for (const d of ['shots', 'voice', 'slides', 'parts']) mkdirSync(`${OUT}/${d}`, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const story = JSON.parse(readFileSync(`${DEMO}/story.json`, 'utf8'));

/* ---------- the script ---------- */

const SCENES = [
  { id: 'title', slide: 'title', say: "Hi, I'm Subramani Nagaraj. This is VisitBridge, my project for IEEE Hack for Humanity 2026." },
  { id: 'hard', slide: 'photo', img: `${ROOT}/notes/gallery/01-the-hard-day.jpg`, caption: 'For many autistic kids, a haircut feels like this.', say: "Imagine your child is so scared of a haircut that they scream and kick, and you have to hold them down. For many autistic kids, this is every haircut, every dentist visit, and every shot." },
  { id: 'stats', slide: 'stats', say: "One in thirty-one kids in the US is autistic. In one study, twenty-five of eighty-five were held down at the dentist. Often the scariest part is not the pain. It is not knowing what comes next." },
  { id: 'idea', slide: 'idea', say: "Therapists use social stories to show a child what will happen. But one takes an hour to make. VisitBridge makes one in about a minute, for the exact visit, for your child." },
  { id: 'child', slide: 'phone', shot: 'child', head: 'Tell us about your child, once', points: ['Age, favorite thing, comfort item', "What's hard, and what helps", 'Saved only on this phone', 'The name is never sent to the AI'], say: "A parent tells us about their child once. It stays only on their phone, and the name is never sent to the AI." },
  { id: 'form', slide: 'phone', shot: 'story', head: 'Pick the visit and the fear', points: ['Doctor, dentist, haircut, bath, bedtime...', 'What scares them most', 'Or say it in your own words', 'In 40 languages'], say: "Then they pick the visit, and what scares their child most." },
  { id: 'meet', slide: 'meet', say: "Here is a real story. Leo loves lawn mowers, so Mozy the Mower tells it. Same barber shop, same mom, same clothes, on every page." },
  ...[0, 3, 7, 11].map((n) => ({ id: `page${n + 1}`, slide: 'page', page: n })),
  { id: 'safe', slide: 'safe', say: "It is honest. It never says it won't hurt. It always has the comfort item and a plan for the scary part, using tips from children's doctors, so the AI cannot make up medical advice." },
  { id: 'play', slide: 'phone', shot: 'play-setup', head: 'Play Coach: free, every day, ages 1 to 5', points: ['One 5-minute game a day', 'Parents pick 1 or 2 goals', 'See the research for their child\u2019s age', 'For families waiting for therapy'], say: "Families often wait months for therapy. So I built Play Coach: a free, five-minute game a day for ages one to five, toward the parent's goal, like fewer meltdowns." },
  { id: 'card', slide: 'phone', shot: 'play-card', head: 'Built around what they love', points: ['Simple steps a tired parent can follow', 'Words to say, at their talk level', 'Gentler games on hard days', 'A summary to share with a therapist'], say: "Each game uses what the child loves, with simple steps and the words to say." },
  { id: 'proof', slide: 'phone', shot: 'play-proof', head: '"Has this worked for other kids?"', points: ['PACT: 152 children', 'ESDM: 48 children', 'PRT: 48 children', 'JASPER: 96 children', 'National review of 972 studies'], say: "And every card shows the published studies behind it, and how many children were in them." },
  { id: 'tech', slide: 'tech', say: "It runs on Cloudflare Workers AI, works in forty languages, and needs no account." },
  { id: 'end', slide: 'end', say: 'Because no child should be held down and scared just because nobody showed them what was coming. Try it free at VisitBridge dot alavai dot A.I. Thank you.' },
];

/* ---------- headless Chrome ---------- */

async function openChrome(port) {
  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/vb-video-chrome-${port}`,
    '--hide-scrollbars', '--allow-file-access-from-files', '--window-size=1920,1080', 'about:blank',
  ], { stdio: 'ignore' });
  let ws;
  for (let i = 0; i < 40 && !ws; i++) {
    await sleep(250);
    try {
      const page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page');
      if (page) ws = new WebSocket(page.webSocketDebuggerUrl);
    } catch {}
  }
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0;
  const waiting = new Map();
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (waiting.has(msg.id)) { waiting.get(msg.id)(msg); waiting.delete(msg.id); }
  });
  const cdp = (method, params = {}) => new Promise((r) => { const n = ++id; waiting.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  const js = async (code) => (await cdp('Runtime.evaluate', { expression: `(async()=>{${code}})()`, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const shot = async (file) => {
    const { result } = await cdp('Page.captureScreenshot', { format: 'png' });
    writeFileSync(file, Buffer.from(result.data, 'base64'));
    console.log(file.replace(`${ROOT}/`, ''));
  };
  return { cdp, js, shot, close: () => { ws.close(); chrome.kill(); } };
}

/* ---------- 1. phone screenshots of the real app ---------- */

async function appShots() {
  const need = ['child', 'story', 'play-setup', 'play-card', 'play-proof'];
  if (need.every((n) => existsSync(`${OUT}/shots/${n}.png`))) return;
  const { cdp, js, shot, close } = await openChrome(9334);
  await cdp('Emulation.setDeviceMetricsOverride', { width: 430, height: 932, deviceScaleFactor: 2, mobile: true });
  await cdp('Page.navigate', { url: `${APP}/#home` });
  await sleep(1500);
  await js(`localStorage.clear(); localStorage.setItem('vb-kid', JSON.stringify({name:'Leo', age:'3-5', favorite:'Lawn mowers', comfort:'blue blanket', sensory:['loud','touched'], tips:['show','count','comfort'], look:{style:'real', skin:'medium-dark', hair:'curly', hairColor:'black'}})); location.reload();`);
  await sleep(2500);
  const top = (sel) => `const n=document.querySelector(${JSON.stringify(sel)}); scrollTo(0, n.getBoundingClientRect().top + scrollY - 140);`;

  await js(`location.hash='#child'; await new Promise(r=>setTimeout(r,800)); ${top('#kid-form')}`);
  await sleep(1200);
  await shot(`${OUT}/shots/child.png`);

  await js(`location.hash='#story'; await new Promise(r=>setTimeout(r,800));
    [...document.querySelectorAll('#routine-tiles *')].find(n=>n.textContent.trim()==='Haircut')?.click();
    [...document.querySelectorAll('#fear-tiles *')].find(n=>/Loud or sudden/.test(n.textContent) && n.matches('label,button'))?.click();
    document.querySelector('[name=fearText]').value='He cries when the clippers buzz near his ears';
    ${top('#fear-tiles')}`);
  await sleep(1200);
  await shot(`${OUT}/shots/story.png`);

  await js(`localStorage.removeItem('vb-play'); location.hash='#play'; await new Promise(r=>setTimeout(r,800));
    const f=document.querySelector('#play-app form');
    f.querySelector('[name=age][value="3-5"]').click(); f.querySelector('[name=talk][value=few]').click();
    f.querySelector('[name=favorite]').value='lawn mowers';
    f.querySelector('[name=goals][value=talk]').click(); f.querySelector('[name=goals][value=calm]').click();
    await new Promise(r=>setTimeout(r,300)); ${top('[name=goals]')} scrollBy(0, 150);`);
  await sleep(1200);
  await shot(`${OUT}/shots/play-setup.png`);

  await js(`document.querySelector('#play-app form button[type=submit]').click();
    for (let i=0;i<80 && !document.querySelector('.play-card .btn-big');i++) await new Promise(r=>setTimeout(r,500));
    ${top('.play-card')}`);
  await sleep(1500);
  await shot(`${OUT}/shots/play-card.png`);

  await js(`const d=document.querySelector('.play-card .play-proof'); d.open=true; ${top('.play-card .play-proof')}`);
  await sleep(1200);
  await shot(`${OUT}/shots/play-proof.png`);

  await js(`localStorage.clear()`);
  close();
}

/* ---------- 2. narration ---------- */

async function narration() {
  for (const s of SCENES) {
    if (s.page != null) { s.audio = `${DEMO}/${story.pages[s.page].media.voice}`; continue; }
    s.audio = `${OUT}/voice/${s.id}.mp3`;
    const key = `${OUT}/voice/${s.id}.txt`;
    if (existsSync(s.audio) && existsSync(key) && readFileSync(key, 'utf8') === s.say) continue;
    const res = await fetch(`${APP}/api/voice`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: APP },
      body: JSON.stringify({ text: s.say, lang: 'en', voice: 'man' }),
    });
    if (!res.ok) throw new Error(`voice ${s.id}: ${res.status} ${await res.text()}`);
    writeFileSync(s.audio, Buffer.from(await res.arrayBuffer()));
    writeFileSync(key, s.say);
    console.log(`voice ${s.id}`);
  }
}

const duration = (file) => {
  const err = spawnSync(ffmpeg, ['-hide_banner', '-i', file], { encoding: 'utf8' }).stderr;
  const [, h, m, sec] = err.match(/Duration: (\d+):(\d+):([\d.]+)/);
  return h * 3600 + m * 60 + Number(sec);
};

/* ---------- 3. slides ---------- */

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const CSS = `
@font-face { font-family: Nunito; src: url('file://${ROOT}/public/fonts/nunito.woff2'); font-weight: 200 1000; }
* { box-sizing: border-box; margin: 0; }
body { width: 1920px; height: 1080px; overflow: hidden; font-family: Nunito, sans-serif; color: #1e1b3a;
  background: radial-gradient(circle at 12% 18%, #ede9fe 0, transparent 45%), radial-gradient(circle at 88% 85%, #d9f7f3 0, transparent 45%), #fbf8f4; }
.brand { position: absolute; top: 56px; left: 80px; display: flex; gap: 18px; align-items: center; font-size: 40px; font-weight: 900; }
.brand img { width: 64px; height: 64px; }
.wrap { position: absolute; inset: 0; padding: 180px 120px 100px; display: flex; flex-direction: column; justify-content: center; gap: 36px; }
h1 { font-size: 92px; line-height: 1.05; font-weight: 900; letter-spacing: -1px; }
h2 { font-size: 68px; line-height: 1.1; font-weight: 900; }
.sub { font-size: 40px; color: #5b5876; font-weight: 700; line-height: 1.35; }
.accent { color: #4f46e5; }
.pill { display: inline-block; padding: 14px 30px; border-radius: 999px; background: #4f46e5; color: white; font-size: 30px; font-weight: 800; }
ul { padding: 0; list-style: none; display: grid; gap: 26px; }
li { font-size: 42px; font-weight: 700; line-height: 1.25; padding-left: 64px; position: relative; }
li::before { content: ''; position: absolute; left: 0; top: 10px; width: 34px; height: 34px; border-radius: 50%; background: #2ec4b6; }
.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; }
.card { background: white; border-radius: 36px; padding: 48px; box-shadow: 0 10px 40px rgba(30,27,58,.08); display: grid; gap: 18px; align-content: start; }
.big { font-size: 104px; white-space: nowrap; font-weight: 1000; color: #4f46e5; line-height: 1; }
.card p { font-size: 34px; font-weight: 700; line-height: 1.3; }
.card small { font-size: 24px; color: #5b5876; font-weight: 700; }
.phone { position: absolute; left: 150px; top: 60px; width: 452px; height: 960px; border-radius: 64px; background: #1e1b3a; padding: 16px; box-shadow: 0 30px 80px rgba(30,27,58,.25); }
.phone img { width: 100%; height: 100%; object-fit: cover; object-position: top; border-radius: 50px; }
.side { position: absolute; left: 720px; right: 110px; top: 0; bottom: 0; display: flex; flex-direction: column; justify-content: center; gap: 48px; }
.hole { position: absolute; left: 80px; top: 90px; width: 1200px; height: 900px; border-radius: 28px; background: #000; box-shadow: 0 30px 80px rgba(30,27,58,.25); }
.pagebox { position: absolute; left: 1340px; right: 80px; top: 90px; bottom: 90px; display: flex; flex-direction: column; justify-content: center; gap: 36px; }
.pagebox .n { font-size: 30px; font-weight: 800; color: #5b5876; }
.pagebox .t { font-size: 52px; font-weight: 900; line-height: 1.2; }
.pagebox .s { font-size: 32px; font-weight: 700; line-height: 1.4; color: #4f46e5; background: white; border-radius: 28px; padding: 32px; }
.photo { position: absolute; inset: 0; background-size: cover; background-position: center; }
`;
const brand = `<div class="brand"><img src="file://${ROOT}/public/img/icon.svg">VisitBridge</div>`;

function slideHtml(s) {
  switch (s.slide) {
    case 'title': return `${brand}<div class="wrap"><span class="pill" style="align-self:flex-start">IEEE Hack for Humanity 2026 · AI for Accessibility &amp; Disability Inclusion</span>
      <h1>No more scary surprises<br><span class="accent">for autistic kids.</span></h1>
      <p class="sub">AI story videos that show a child what is coming, plus free daily play for ages 1 to 5.</p>
      <p class="sub" style="font-size:34px">Subramani Nagaraj</p></div>`;
    case 'photo': return `<div class="photo" style="background-image:url('file://${s.img}')"></div>`;
    case 'stats': return `${brand}<div class="wrap"><h2>The problem</h2><div class="cards">
      <div class="card"><div class="big">1 in 31</div><p>kids in the US is autistic</p><small>CDC, 2025</small></div>
      <div class="card"><div class="big">25 of 85</div><p>autistic kids were held down with a restraint at the dentist</p><small>Marshall et al., 2008</small></div>
      <div class="card"><div class="big">14%</div><p>had the visit explained to them first, while 96% of parents said visits were really hard</p><small>Koh et al., 2005</small></div>
      </div></div>`;
    case 'idea': return `${brand}<div class="wrap"><h2>Social stories help.<br><span class="accent">But they take an hour to make.</span></h2>
      <ul><li>Therapists use short picture stories to show what will happen</li><li>It has to be about that visit, for that child</li><li>VisitBridge makes one in about a minute</li></ul></div>`;
    case 'phone': return `<div class="phone"><img src="file://${OUT}/shots/${s.shot}.png"></div>
      <div class="side"><h2>${esc(s.head)}</h2><ul>${s.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>`;
    case 'meet': return `${brand}<div class="wrap"><h2>A real story VisitBridge made</h2>
      <ul><li>Leo, age 3 to 5, scared of the clipper buzz</li><li>He loves lawn mowers, so <b class="accent">Mozy the Mower</b> tells the story</li><li>Same barber shop, same mom, same clothes on every page</li><li>Every page is a short video, timed to the voice</li></ul></div>`;
    case 'page': {
      const p = story.pages[s.page];
      return `<div class="hole"></div><div class="pagebox"><div class="n">Page ${s.page + 1} of ${story.pages.length}</div>
        <div class="t">${esc(p.text)}</div><div class="s">${esc(story.friend?.name ?? 'Mozy the Mower')}: "${esc(p.say.replace(/\[[a-z ]+\]\s*/gi, ''))}"</div></div>`;
    }
    case 'safe': return `${brand}<div class="wrap"><h2>Honest, gentle, and safe</h2><ul>
      <li>Never "it won't hurt". It says "a sharp poke, 2 seconds, then done"</li>
      <li>Always the comfort item, an "it's OK to feel worried" page, and a happy ending</li>
      <li>A plan for the scary part: "cover your ears and count to 5"</li>
      <li>Tips from a fixed list by AAP, pediatric dentists and autism groups</li></ul></div>`;
    case 'tech': return `${brand}<div class="wrap"><h2>How it's built</h2><div class="cards">
      <div class="card"><p class="accent">Cloudflare Workers AI</p><small>Llama 3.3 70B writes · Lucid Origin draws · Deepgram Aura speaks</small></div>
      <div class="card"><p class="accent">Kling video (fal.ai)</p><small>Pictures become short clips, only when the parent asks</small></div>
      <div class="card"><p class="accent">Private by design</p><small>No accounts · name never sent to AI · everything saved on the phone</small></div>
      </div><p class="sub">40 languages · strict security headers · rate limits · open source (MIT)</p></div>`;
    case 'end': return `<div class="photo" style="background-image:url('file://${ROOT}/notes/gallery/07-the-calm-night-before.jpg'); filter: brightness(.45)"></div>
      <div class="wrap" style="color:white; text-align:center; align-items:center">
      <h2 style="max-width:1500px">No child should be held down and scared just because nobody showed them what was coming.</h2>
      <p class="sub" style="color:white; font-size:56px; font-weight:900">visitbridge.alavai.ai</p>
      <p class="sub" style="color:#e6e2f0">github.com/snagaraj07/visitbridge · Subramani Nagaraj</p></div>`;
  }
}

async function slides() {
  const { cdp, shot, close } = await openChrome(9335);
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  for (const s of SCENES) {
    const html = `${OUT}/slides/${s.id}.html`;
    writeFileSync(html, `<!doctype html><meta charset="utf-8"><style>${CSS}</style>${slideHtml(s)}`);
    await cdp('Page.navigate', { url: `file://${html}` });
    await sleep(900);
    await shot(`${OUT}/slides/${s.id}.png`);
  }
  close();
}

/* ---------- 4. video ---------- */

const ENC = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-ac', '2'];

function part(s, i) {
  const out = `${OUT}/parts/${String(i).padStart(2, '0')}-${s.id}.mp4`;
  const talk = duration(s.audio);
  const D = +(talk + 1.0).toFixed(2);
  const fade = `fade=in:st=0:d=0.35,fade=out:st=${D - 0.35}:d=0.35`;
  const audio = `adelay=400|400,aformat=sample_rates=48000:channel_layouts=stereo,apad,atrim=0:${D},afade=out:st=${D - 0.3}:d=0.3`;
  let args;
  if (s.slide === 'page') {
    const clip = `${DEMO}/${story.pages[s.page].media.video}`;
    const rate = Math.min(1, Math.max(0.7, duration(clip) / (talk + 0.3)));
    args = ['-loop', '1', '-framerate', '30', '-t', `${D}`, '-i', `${OUT}/slides/${s.id}.png`, '-i', clip, '-i', s.audio,
      '-filter_complex', `[1:v]setpts=PTS/${rate.toFixed(3)},fps=30,scale=1200:900,tpad=stop_mode=clone:stop_duration=20,trim=0:${D},setpts=PTS-STARTPTS[c];[0:v][c]overlay=80:90,format=yuv420p,${fade}[v];[2:a]${audio}[a]`];
  } else if (s.slide === 'photo') {
    args = ['-loop', '1', '-framerate', '30', '-t', `${D}`, '-i', `${OUT}/slides/${s.id}.png`, '-i', s.audio,
      '-filter_complex', `[0:v]scale=3840:2160,zoompan=z='1+0.06*on/(${D}*30)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30,format=yuv420p,${fade}[v];[1:a]${audio}[a]`];
  } else {
    args = ['-loop', '1', '-framerate', '30', '-t', `${D}`, '-i', `${OUT}/slides/${s.id}.png`, '-i', s.audio,
      '-filter_complex', `[0:v]format=yuv420p,${fade}[v];[1:a]${audio}[a]`];
  }
  execFileSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', ...args, '-map', '[v]', '-map', '[a]', '-t', `${D}`, ...ENC, out]);
  console.log(`part ${s.id} ${D}s`);
  return out;
}

await appShots();
await narration();
await slides();
const parts = SCENES.map(part);
writeFileSync(`${OUT}/parts/list.txt`, parts.map((p) => `file '${p}'`).join('\n'));
const final = `${OUT}/VisitBridge-demo.mp4`;
execFileSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${OUT}/parts/list.txt`, '-c', 'copy', '-movflags', '+faststart', final]);
console.log(`${final} ${duration(final).toFixed(1)}s`);
