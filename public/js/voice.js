// Whose voice tells the story: a ready-made AI voice, or the parent's own
// voice made from a short recording (ElevenLabs, only with consent).
import { el } from './dom.js';
import { features } from './features.js';

const VOICE_KEY = 'vb-voice';

// Short, warm lines with a range of feelings, so the copy sounds alive.
export const SENTENCES = [
  'Hi sweetheart! Guess what? Today we are going on a little adventure together.',
  'Hmm, let me think. First we ride in the car, and then we wait in a big room with chairs.',
  'Ooh, look at that! The chair goes up, up, up, and then it leans way back.',
  'Uh-oh, this part might feel cold for a few seconds. I am right here with you.',
  'Hee hee, that tickles! And now we are all done. I am so proud of you. Let\'s go home and play!',
];

const KINDS = [
  { id: 'woman', label: '👩 Warm woman\'s voice' },
  { id: 'man', label: '👨 Warm man\'s voice' },
  { id: 'mom', label: '🎙️ Mom\'s own voice', clone: true },
  { id: 'dad', label: '🎙️ Dad\'s own voice', clone: true },
];

export function loadVoice() {
  try {
    return { kind: 'woman', ...JSON.parse(localStorage.getItem(VOICE_KEY) || '{}') };
  } catch {
    return { kind: 'woman' };
  }
}

function saveVoice(voice) {
  localStorage.setItem(VOICE_KEY, JSON.stringify(voice));
}

// What the player sends to /api/voice.
export function voiceRequest() {
  const v = loadVoice();
  return v.voiceId ? { voiceId: v.voiceId } : { voice: v.kind === 'man' || v.kind === 'dad' ? 'man' : 'woman' };
}

export async function forgetVoice() {
  const v = loadVoice();
  localStorage.removeItem(VOICE_KEY);
  if (v.voiceId) {
    await fetch('/api/voice/delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ voiceId: v.voiceId }),
    }).catch(() => {});
  }
}

export async function initVoicePicker(root) {
  const { clone } = await features();
  const status = el('p', { class: 'status', role: 'status' });
  const panel = el('div', { class: 'voice-panel' });
  const seg = el('div', { class: 'seg seg-wrap', role: 'radiogroup', 'aria-label': 'Whose voice' },
    KINDS.filter((k) => clone || !k.clone).map((k) =>
      el('label', {}, el('input', { type: 'radio', name: 'voiceKind', value: k.id }), el('span', {}, k.label))),
  );
  root.replaceChildren(seg, panel, status,
    !clone && el('p', { class: 'hint' }, 'Recording a parent\'s own voice turns on when this server has an ElevenLabs key.'));

  const render = () => {
    const v = loadVoice();
    for (const r of seg.querySelectorAll('input')) r.checked = r.value === v.kind;
    const k = KINDS.find((x) => x.id === v.kind);
    if (!k?.clone) return panel.replaceChildren();
    if (v.voiceId) return panel.replaceChildren(readyCard(v));
    panel.replaceChildren(recorder(v.kind));
  };

  seg.addEventListener('change', async (e) => {
    const old = loadVoice();
    if (old.voiceId && old.kind !== e.target.value) {
      if (!confirm('This deletes the recorded voice. Continue?')) return render();
      await forgetVoice();
    }
    saveVoice({ kind: e.target.value });
    status.textContent = '';
    render();
  });

  function readyCard(v) {
    const who = v.kind === 'dad' ? 'Dad' : 'Mom';
    return el('div', { class: 'voice-ready' },
      el('strong', {}, `✓ ${who}'s voice is ready. The story friend will talk in it.`),
      el('div', { class: 'actions' },
        el('button', { type: 'button', class: 'btn-plain btn-small', onclick: () => testVoice(status) }, '▶ Hear a test'),
        el('button', {
          type: 'button',
          class: 'btn-plain btn-small',
          onclick: async () => {
            await forgetVoice();
            saveVoice({ kind: v.kind });
            status.textContent = 'Deleted. The copy of the voice is removed from ElevenLabs.';
            render();
          },
        }, '🗑 Delete my voice'),
      ),
    );
  }

  function recorder(kind) {
    let rec = null;
    let chunks = [];
    let wav = null;
    let started = 0;
    let tick = 0;
    const timer = el('span', { class: 'rec-time' }, '0:00');
    const playback = el('audio', { controls: true, hidden: true });
    const consent = el('input', { type: 'checkbox' });
    const save = el('button', { type: 'button', class: 'btn btn-small', disabled: true }, 'Save my voice');
    const recBtn = el('button', { type: 'button', class: 'btn btn-small rec-btn' }, '⏺ Start recording');

    recBtn.addEventListener('click', async () => {
      if (rec) return rec.stop();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        rec = new MediaRecorder(stream);
        chunks = [];
        rec.ondataavailable = (e) => chunks.push(e.data);
        rec.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          clearInterval(tick);
          recBtn.textContent = '⏺ Record again';
          recBtn.classList.remove('on');
          rec = null;
          wav = await toWav(new Blob(chunks, { type: chunks[0]?.type }));
          playback.src = URL.createObjectURL(wav);
          playback.hidden = false;
          save.disabled = !consent.checked;
        };
        rec.start();
        started = Date.now();
        tick = setInterval(() => {
          const s = Math.round((Date.now() - started) / 1000);
          timer.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
        }, 250);
        recBtn.textContent = '⏹ Stop';
        recBtn.classList.add('on');
        status.textContent = 'Recording. Read the sentences out loud, like you are telling a story.';
      } catch {
        status.textContent = 'The microphone is blocked. Allow it in the browser and try again.';
      }
    });

    consent.addEventListener('change', () => (save.disabled = !(consent.checked && wav)));

    save.addEventListener('click', async () => {
      save.disabled = true;
      status.textContent = 'Making the voice. This takes about 10 seconds…';
      const form = new FormData();
      form.append('sample', wav, 'sample.wav');
      form.append('consent', 'yes');
      form.append('who', kind);
      try {
        const res = await fetch('/api/voice/clone', { method: 'POST', body: form });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || 'Could not make the voice.');
        saveVoice({ kind, voiceId: body.voiceId });
        status.textContent = 'Done!';
        render();
      } catch (err) {
        status.textContent = err.message;
        save.disabled = false;
      }
    });

    return el('div', { class: 'voice-rec' },
      el('p', { class: 'hint' }, 'Read these out loud in your storytelling voice. It takes about 40 seconds. A quiet room works best.'),
      el('ol', { class: 'rec-lines' }, SENTENCES.map((s) => el('li', {}, s))),
      el('div', { class: 'actions' }, recBtn, timer),
      playback,
      el('label', { class: 'toggle consent' }, consent,
        el('span', {}, 'This is my own voice. I agree to send this recording to ElevenLabs to make a copy of my voice for my child\'s stories. I can delete it here any time.')),
      save,
    );
  }

  render();
}

async function testVoice(status) {
  status.textContent = 'Loading…';
  const res = await fetch('/api/voice', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'Hmm... hello! [excited] Today we are going on a little adventure together. Ooh, here we go!', lang: 'en', ...voiceRequest() }),
  }).catch(() => null);
  if (!res?.ok) {
    status.textContent = 'Could not play the voice right now.';
    return;
  }
  status.textContent = '';
  new Audio(URL.createObjectURL(await res.blob())).play();
}

// 16-bit mono WAV at 22 kHz: small, and every voice service accepts it.
async function toWav(blob) {
  const RATE = 22050;
  const ctx = new AudioContext();
  const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
  ctx.close();
  const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * RATE), RATE);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  const pcm = (await offline.startRendering()).getChannelData(0);

  const view = new DataView(new ArrayBuffer(44 + pcm.length * 2));
  const put = (at, s) => [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  put(0, 'RIFF');
  view.setUint32(4, 36 + pcm.length * 2, true);
  put(8, 'WAVE');
  put(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, RATE, true);
  view.setUint32(28, RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  put(36, 'data');
  view.setUint32(40, pcm.length * 2, true);
  pcm.forEach((v, i) => view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v)) * 0x7fff, true));
  return new Blob([view], { type: 'audio/wav' });
}
