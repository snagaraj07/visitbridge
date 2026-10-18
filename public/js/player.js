import { el } from './dom.js';
import { picture, FRIENDS, DEFAULT_FRIEND } from './pictures.js';
import { getArt, drawPage, wantsArt, getVideo, demoFile } from './art.js';
import { voiceRequest } from './voice.js';
import { canSpeak, deviceVoice } from './speech.js';
import { language, AI_VOICE } from './languages.js';

const PAUSE_BETWEEN_PAGES = 1400;
// Younger kids need slower talk to follow along.
const PACE = { '3-5': 0.8, '6-8': 0.9, '9-12': 1 };
const CONFETTI = ['⭐', '🎉', '✨', '🎈', '⭐', '✨', '🎉', '⭐', '🎈', '✨', '⭐', '🎉'];

export function friendOf(story) {
  const f = story.friend || (story.theme && { name: story.theme.helper }) || DEFAULT_FRIEND;
  const pic = FRIENDS[f.key] || (story.theme ? FRIENDS.robot : FRIENDS.owl);
  return { name: f.name || DEFAULT_FRIEND.name, img: pic.img, emoji: pic.emoji };
}

// What the friend says, with the child's name filled in or left out.
// voiced() keeps cues like [giggles] for voices that can act them out.
export function voiced(page, name) {
  const line = page.say || page.text;
  if (name) return line.replace(/\bNAME\b/g, name);
  return line
    .replace(/,\s*NAME\b/g, '')
    .replace(/\bNAME,\s*/g, '')
    .replace(/\bNAME\b/g, 'you');
}

export function spoken(page, name) {
  return voiced(page, name).replace(/\[[a-z ]+\]\s*/gi, '').trim();
}

export function playStory(story, { title, kid, lang = 'en' }) {
  const opener = document.activeElement;
  const friend = friendOf(story);
  const tongue = language(lang);
  const voicePick = voiceRequest();
  const aiVoice = Boolean(voicePick.voiceId) || AI_VOICE.includes(tongue.code);
  const textAttrs = { lang: tongue.tag, dir: tongue.rtl ? 'rtl' : 'ltr' };
  let index = 0;
  let playing = false;
  let sayName = Boolean(kid.name);
  let timer = 0;
  let frame = 0;
  let audioCtx = null;
  let analyser = null;
  let clipEl = null;
  const voices = new Map();
  const audio = new Audio();
  audio.preload = 'auto';
  let pace = PACE[story.age ?? story.req?.age ?? kid.age] ?? 0.9;
  const slowPace = Math.min(pace, 0.85);
  const setPace = (to) => {
    pace = to;
    audio.defaultPlaybackRate = pace;
    audio.playbackRate = pace;
    fitClip();
    slowBtn.classList.toggle('on', pace < 1);
    slowBtn.setAttribute('aria-pressed', String(pace < 1));
  };

  /* Layout */

  const bg = el('div', { class: 'pl-bg', 'aria-hidden': 'true' });
  const art = el('div', { class: 'pl-art', 'aria-hidden': 'true' });
  const bars = el('div', { class: 'pl-bars', 'aria-hidden': 'true' }, story.pages.map(() => el('span', {}, el('i'))));
  const sound = el('span', { class: 'pl-sound', 'aria-hidden': 'true' });
  const say = el('p', { class: 'pl-say', 'aria-live': 'polite', ...textAttrs });
  const avatar = el('img', { class: 'pl-friend', src: friend.img, alt: '' });
  const playBtn = el('button', { type: 'button', class: 'pl-btn pl-play', 'aria-label': 'Pause' }, '❚❚');
  const prevBtn = el('button', { type: 'button', class: 'pl-btn', 'aria-label': 'Back' }, '◀');
  const nextBtn = el('button', { type: 'button', class: 'pl-btn', 'aria-label': 'Next' }, '▶');
  const closeBtn = el('button', { type: 'button', class: 'pl-close', 'aria-label': 'Close the story' }, '✕');
  const slowBtn = el('button', { type: 'button', class: 'pl-btn pl-slow', 'aria-label': 'Slow voice', title: 'Slow voice',
    onclick: () => setPace(pace < 1 ? 1 : slowPace) }, '🐢');
  setPace(pace);
  const count = el('span', { class: 'pl-count' });

  const startCard = el('div', { class: 'pl-card pl-start' },
    el('img', { class: 'pl-hero-friend', src: friend.img, alt: '' }),
    el('h2', textAttrs, title),
    el('p', textAttrs, `with ${friend.name}`),
    kid.name && !story.demo && el('label', { class: 'pl-check' },
      el('input', { type: 'checkbox', checked: true, onchange: (e) => { sayName = e.target.checked; voices.clear(); } }),
      ` Say ${kid.name}'s name out loud`,
    ),
    el('button', { type: 'button', class: 'btn btn-big', onclick: () => start() }, '▶ Start the story'),
    kid.name && aiVoice && !story.demo && el('p', { class: 'pl-note' }, 'To say the name, only the first name is sent to make the voice. It is not saved.'),
    !aiVoice && !story.demo && el('p', { class: 'pl-note pl-voice-note' }),
  );

  const voiceNote = startCard.querySelector('.pl-voice-note');
  const noteVoice = () => {
    if (!voiceNote) return;
    voiceNote.textContent = deviceVoice(tongue.tag)
      ? `${tongue.name} is read by this device's own voice.`
      : `This device has no ${tongue.en} voice. The words show on screen, so you can read them aloud together.`;
  };
  noteVoice();
  if (canSpeak) speechSynthesis.addEventListener?.('voiceschanged', noteVoice);

  const endCard = el('div', { class: 'pl-card pl-end', hidden: true },
    el('div', { class: 'pl-confetti', 'aria-hidden': 'true' }, CONFETTI.map((c, i) => el('span', { style: `--i:${i}` }, c))),
    el('img', { class: 'pl-hero-friend', src: friend.img, alt: '' }),
    el('h2', {}, 'The end!'),
    el('p', {}, kid.name ? `You are ready, ${kid.name}!` : 'You are ready!'),
    el('div', { class: 'actions' },
      el('button', { type: 'button', class: 'btn btn-big', onclick: () => { endCard.hidden = true; go(0, true); } }, '↺ Watch again'),
      el('button', { type: 'button', class: 'btn-plain', onclick: () => close() }, 'Close'),
    ),
  );

  const root = el('div', { class: 'player', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    bg,
    art,
    el('div', { class: 'pl-veil', 'aria-hidden': 'true' }),
    el('div', { class: 'pl-top' }, bars, count, closeBtn),
    sound,
    el('button', { type: 'button', class: 'pl-zone pl-zone-back', 'aria-label': 'Back', onclick: () => go(index - 1, true) }),
    el('button', { type: 'button', class: 'pl-zone pl-zone-next', 'aria-label': 'Next', onclick: () => go(index + 1, true) }),
    el('div', { class: 'pl-caption' },
      el('div', { class: 'pl-who' }, avatar, el('span', {}, friend.name)),
      say,
      el('div', { class: 'pl-controls' }, prevBtn, playBtn, nextBtn, slowBtn),
    ),
    startCard,
    endCard,
  );

  /* Pages */

  const show = async () => {
    const page = story.pages[index];
    clearTimeout(timer);
    stopVoice();

    [...bars.children].forEach((b, i) => {
      b.classList.toggle('done', i < index);
      b.classList.toggle('on', i === index);
    });
    count.textContent = `${index + 1} / ${story.pages.length}`;
    prevBtn.disabled = index === 0;

    say.replaceChildren(...words(spoken(page, sayName && kid.name), tongue.tag));
    sound.textContent = page.sound || '';
    sound.hidden = !page.sound;
    sound.classList.remove('pop');
    void sound.offsetWidth;
    sound.classList.add('pop');

    await setArt(page);
    voiceFor(index + 1);
    if (playing) speakPage();
  };

  const setArt = async (page) => {
    const i = index;
    const fallback = picture(page.picture === 'friend' ? 'ok' : page.picture);
    const clip = !page.noArt && (await getVideo(story, i));
    const url = page.photo || (!page.noArt && (await getArt(story, i)));
    if (i !== index) return;
    if (clip) return playClip(clip, url);
    if (url) return paint(url);

    clipEl = null;
    art.replaceChildren(
      el('div', { class: `pl-fallback scene-${fallback.scene}` },
        el('img', { src: page.picture === 'friend' ? friend.img : fallback.img, alt: '' }),
        wantsArt(story, i) && el('span', { class: 'pl-drawing' }, 'Drawing this page…'),
      ),
    );
    bg.style.backgroundImage = '';
    if (wantsArt(story, i)) {
      drawPage(story, i, kid).then((drawn) => {
        if (i !== index) return;
        if (drawn) paint(drawn);
        else art.querySelector('.pl-drawing')?.remove();
      });
    }
  };

  // The new page fades in over the old one, like a film, instead of a hard cut.
  const swap = (node) => {
    const old = [...art.children];
    art.append(node);
    setTimeout(() => old.forEach((n) => n.remove()), 900);
  };

  // A clip is about 5 seconds and the page talks for longer. Playing it once, slowed to
  // fill the talking, then resting on the last frame looks real; looping jumps back.
  const playClip = (clip, poster) => {
    const video = el('video', { class: `pl-video kb-${index % 4}`, src: clip, poster: poster || null, muted: true, playsinline: true, autoplay: true, onloadedmetadata: () => fitClip() });
    video.muted = true;
    clipEl = video;
    swap(video);
    video.play().catch(() => {});
    fitClip();
    bg.style.backgroundImage = poster ? `url("${poster}")` : '';
  };

  function fitClip() {
    if (!clipEl || !clipEl.duration || !audio.duration) return;
    const talking = audio.duration / pace + PAUSE_BETWEEN_PAGES / pace / 1000;
    clipEl.playbackRate = Math.min(1, Math.max(0.7, clipEl.duration / talking));
  }

  const paint = (url) => {
    clipEl = null;
    const img = el('img', { class: `pl-img kb-${index % 4}`, src: url, alt: '' });
    swap(img);
    bg.style.backgroundImage = `url("${url}")`;
  };

  const go = (to, user) => {
    if (to < 0) return;
    if (to >= story.pages.length) return finish();
    index = to;
    if (user && !playing) setPlaying(true);
    show();
  };

  const finish = () => {
    setPlaying(false);
    stopVoice();
    endCard.hidden = false;
    endCard.querySelector('button').focus();
  };

  /* Voice */

  function voiceFor(i) {
    const page = story.pages[i];
    if (!page) return Promise.resolve(null);
    if (story.demo) return Promise.resolve(demoFile(story, i, 'voice'));
    if (!aiVoice) return Promise.resolve(null);
    if (!voices.has(i)) {
      const text = voiced(page, sayName && kid.name);
      voices.set(i, fetch('/api/voice', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text, lang, ...voicePick }),
      })
        .then((res) => (res.ok ? res.blob() : null))
        .then((blob) => (blob ? URL.createObjectURL(blob) : null))
        .catch(() => null));
    }
    return voices.get(i);
  }

  async function speakPage() {
    const i = index;
    const url = await voiceFor(i);
    if (i !== index || !playing) return;
    if (url) {
      audio.src = url;
      audio.play().catch(() => browserVoice(i));
      talk();
    } else {
      browserVoice(i);
    }
  }

  function browserVoice(i) {
    const text = spoken(story.pages[i], sayName && kid.name);
    const voice = deviceVoice(tongue.tag);
    if (!voice) return readAlong(i, text);
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = tongue.tag;
    u.rate = Math.max(0.7, 0.95 * pace);
    u.pitch = 1.1;
    u.addEventListener('boundary', (e) => highlight(e.charIndex / text.length));
    u.addEventListener('end', () => afterPage(i));
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    root.classList.add('talking');
  }

  // No voice at all: light up the words at a gentle reading pace.
  function readAlong(i, text) {
    const ms = Math.max(3000, (text.length * 90) / pace);
    const began = performance.now();
    const tick = () => {
      if (i !== index || !playing) return;
      const p = (performance.now() - began) / ms;
      highlight(p);
      if (p >= 1) return afterPage(i);
      frame = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(frame);
    tick();
  }

  function afterPage(i) {
    root.classList.remove('talking');
    root.style.setProperty('--talk', 0);
    highlight(1);
    if (i !== index || !playing) return;
    timer = setTimeout(() => go(index + 1), PAUSE_BETWEEN_PAGES / pace);
  }

  function stopVoice() {
    audio.pause();
    if (canSpeak) speechSynthesis.cancel();
    cancelAnimationFrame(frame);
    root.classList.remove('talking');
    root.style.setProperty('--talk', 0);
  }

  // Move the friend with the loudness of the voice so it looks like it is talking.
  function talk() {
    root.classList.add('talking');
    const data = analyser && new Uint8Array(analyser.fftSize);
    const tick = () => {
      if (analyser) {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += (v - 128) ** 2;
        root.style.setProperty('--talk', Math.min(1, Math.sqrt(sum / data.length) / 30).toFixed(2));
      }
      if (audio.duration) highlight(audio.currentTime / audio.duration);
      frame = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(frame);
    tick();
  }

  audio.addEventListener('loadedmetadata', fitClip);
  audio.addEventListener('ended', () => {
    cancelAnimationFrame(frame);
    afterPage(index);
  });

  function highlight(progress) {
    const spans = say.children;
    const total = say.textContent.length || 1;
    for (const span of spans) span.classList.toggle('said', Number(span.dataset.at) / total < progress);
  }

  /* Controls */

  function setPlaying(on) {
    playing = on;
    playBtn.textContent = on ? '❚❚' : '▶';
    playBtn.setAttribute('aria-label', on ? 'Pause' : 'Play');
    root.classList.toggle('paused', !on);
  }

  function start() {
    try {
      audioCtx = new AudioContext();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      audioCtx.createMediaElementSource(audio).connect(analyser);
      analyser.connect(audioCtx.destination);
    } catch {
      analyser = null;
    }
    root.requestFullscreen?.().catch(() => {});
    startCard.hidden = true;
    setPlaying(true);
    show();
    playBtn.focus();
  }

  function close() {
    clearTimeout(timer);
    stopVoice();
    audioCtx?.close();
    for (const p of voices.values()) p.then((u) => u && URL.revokeObjectURL(u));
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    document.removeEventListener('keydown', onKey);
    if (canSpeak) speechSynthesis.removeEventListener?.('voiceschanged', noteVoice);
    root.remove();
    document.body.classList.remove('has-player');
    opener?.focus?.();
  }

  function onKey(e) {
    if (e.key === 'Escape') return close();
    if (!startCard.hidden || !endCard.hidden) return;
    if (e.key === 'ArrowRight') go(index + 1, true);
    if (e.key === 'ArrowLeft') go(index - 1, true);
    if (e.key === ' ' && e.target === document.body) {
      e.preventDefault();
      playBtn.click();
    }
  }

  playBtn.addEventListener('click', () => {
    if (playing) {
      setPlaying(false);
      clearTimeout(timer);
      stopVoice();
    } else {
      setPlaying(true);
      speakPage();
    }
  });
  prevBtn.addEventListener('click', () => go(index - 1, true));
  nextBtn.addEventListener('click', () => go(index + 1, true));
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', onKey);

  document.body.append(root);
  document.body.classList.add('has-player');
  setArt(story.pages[0]);
  voiceFor(0);
  startCard.querySelector('.btn-big').focus();
}

// Split into words for the read-along highlight. Intl.Segmenter also splits
// languages written without spaces, like Chinese, Japanese, and Thai.
function words(sentence, tag) {
  const parts = 'Segmenter' in Intl
    ? [...new Intl.Segmenter(tag, { granularity: 'word' }).segment(sentence)].map((s) => s.segment)
    : sentence.split(/(\s+)/);
  let at = 0;
  return parts.map((part) => {
    const node = /^\s+$/.test(part) ? part : el('span', { 'data-at': at }, part);
    at += part.length;
    return node;
  });
}
