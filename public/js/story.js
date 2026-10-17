import { el } from './dom.js';
import { PICTURES, picture } from './pictures.js';
import { getArt, drawPage, drawStory, isDrawing, wantsArt, deleteStoryArt, getArtBlob } from './art.js';
import { playStory, friendOf, spoken } from './player.js';
import { language } from './languages.js';
import { makeVideo, getVideo, isMaking } from './video.js';
import { features } from './features.js';

const VIDEO_STATUS = {
  waiting: '🎬 Waiting to make the video…',
  making: '🎬 Making the video (1 to 3 minutes)…',
  failed: 'The video did not work. Try again from "Change picture".',
};

const STORIES_KEY = 'vb-stories';
const PHOTO_SIZE = 640;

/* Saved stories */

export function loadStories() {
  try {
    return JSON.parse(localStorage.getItem(STORIES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveStory(story) {
  if (story.sample) return story;
  const saved = {
    id: Date.now().toString(36),
    title: story.title,
    pages: story.pages,
    friend: story.friend,
    lang: story.lang,
    plan: story.plan,
    req: story.req,
  };
  store([saved, ...loadStories()].slice(0, 5));
  return saved;
}

export function deleteStory(id) {
  store(loadStories().filter((s) => s.id !== id));
  deleteStoryArt(id);
}

function updateStory(story) {
  if (!story.id) return true;
  return store(loadStories().map((s) => (s.id === story.id ? story : s)));
}

// Photos can fill up localStorage, so a failed write is reported instead of thrown.
function store(list) {
  try {
    localStorage.setItem(STORIES_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

// For the parent: how to help with the scary parts, and what to ask the staff.
function planCard(plan) {
  return el('section', { class: 'plan', 'aria-label': 'Plan for the scary parts' },
    el('h3', {}, '🛡️ Your plan for the scary parts'),
    el('div', { class: 'plan-grid' }, plan.map((f) => el('div', { class: 'plan-item' },
      el('h4', {}, f.label),
      el('p', { class: 'plan-label' }, 'In the story, your child practices:'),
      el('ul', {}, f.helps.map((h) => el('li', {}, h))),
      f.ask.length > 0 && el('p', { class: 'plan-label' }, 'Ask the staff for:'),
      f.ask.length > 0 && el('ul', {}, f.ask.map((a) => el('li', {}, a))),
      el('p', { class: 'plan-src' }, `From: ${f.src}`),
    ))),
  );
}

/* Parent view: every page at once, to check and fix before the child watches */

export function openStory(out, story, title, kid, { remake } = {}) {
  const friend = friendOf(story);
  const status = el('p', { class: 'status', role: 'status' });
  const cards = story.pages.map((_, i) => el('li', { class: 'sb-card' }));
  const videoState = new Map();
  const videoBtn = el('button', { type: 'button', class: 'btn-plain', hidden: true, onclick: () => makeAllVideos() }, '🎬 Make it a real video');
  features().then((f) => (videoBtn.hidden = !f.video || story.sample || story.demo));

  const startVideo = (i) => {
    videoState.set(i, 'waiting');
    refresh(i);
    makeVideo(story, i, (s) => {
      videoState.set(i, s);
      refresh(i);
    });
  };

  async function makeAllVideos() {
    const ready = [];
    for (let i = 0; i < story.pages.length; i++) {
      const page = story.pages[i];
      if (page.noArt || isMaking(story, i) || (await getVideo(story, i))) continue;
      if (page.photo || (await getArtBlob(story, i))) ready.push(i);
    }
    if (!ready.length) {
      status.textContent = 'Every page with a picture already has a video, or the pictures are still drawing.';
      return;
    }
    if (!confirm(`Make ${ready.length} short video clips from the pictures? Each takes 1 to 3 minutes and costs about $0.25 with fal.ai.`)) return;
    ready.forEach(startVideo);
    status.textContent = 'Making the videos. You can keep checking pages while they finish.';
  }
  const play = () => playStory(story, { title, kid, lang: story.lang });
  const tongue = language(story.lang);
  const textAttrs = { lang: tongue.tag, dir: tongue.rtl ? 'rtl' : 'ltr' };

  const drawCard = async (i) => {
    const page = story.pages[i];
    const card = cards[i];
    const media = el('div', { class: 'sb-media' });
    card.replaceChildren(
      media,
      el('div', { class: 'sb-body' },
        el('span', { class: 'sb-num' }, `Page ${i + 1}`, page.sound && el('em', {}, page.sound)),
        el('p', { class: 'sb-text', ...textAttrs }, page.text),
        page.say && el('p', { class: 'sb-say', ...textAttrs }, el('img', { src: friend.img, alt: '' }), spoken(page, kid.name)),
        el('div', { class: 'sb-actions no-print' },
          el('button', { type: 'button', class: 'btn-plain btn-small', 'aria-expanded': 'false', onclick: (e) => togglePicker(i, e.currentTarget) }, 'Change picture'),
        ),
      ),
    );
    await paintMedia(i, media);
  };

  const paintMedia = async (i, media) => {
    const page = story.pages[i];
    const clip = !page.noArt && (await getVideo(story, i));
    const url = page.photo || (!page.noArt && (await getArt(story, i)));
    const note = VIDEO_STATUS[videoState.get(i)];
    if (clip) {
      return media.replaceChildren(el('video', { class: 'sb-art', src: clip, poster: url || null, muted: true, loop: true, autoplay: true, playsinline: true }));
    }
    if (url) {
      return media.replaceChildren(
        el('img', { class: 'sb-art', src: url, alt: '' }),
        note && el('span', { class: `sb-drawing${videoState.get(i) === 'failed' ? '' : ' shimmer-text'}` }, note),
      );
    }

    const fixed = page.picture === 'friend' ? { img: friend.img, scene: 'party' } : picture(page.picture);
    const drawing = wantsArt(story, i);
    media.replaceChildren(
      el('div', { class: `sb-fallback scene-${fixed.scene}${drawing ? ' shimmer' : ''}` },
        el('img', { src: fixed.img, alt: '' }),
        drawing && el('span', { class: 'sb-drawing' }, isDrawing(story, i) ? 'Drawing…' : 'Waiting to draw…'),
      ),
    );
  };

  const refresh = (i) => paintMedia(i, cards[i].querySelector('.sb-media'));

  const save = (message) => {
    status.textContent = updateStory(story)
      ? message
      : 'Changed for now, but this device is out of space. Delete an old story to keep it.';
  };

  function togglePicker(i, button) {
    const card = cards[i];
    const open = card.querySelector('.picker');
    if (open) {
      open.remove();
      button.setAttribute('aria-expanded', 'false');
      return;
    }
    button.setAttribute('aria-expanded', 'true');
    const page = story.pages[i];
    const done = (message) => {
      card.querySelector('.picker')?.remove();
      button.setAttribute('aria-expanded', 'false');
      save(message);
      refresh(i);
      button.focus();
    };

    const picker = el('div', { class: 'picker' },
      page.scene && el('button', {
        type: 'button',
        class: 'btn btn-small',
        onclick: () => {
          delete page.photo;
          delete page.noArt;
          page.artVersion = (page.artVersion || 0) + 1;
          done('Drawing a new picture…');
          drawPage(story, i, kid).then(() => refresh(i));
          refresh(i);
        },
      }, '✨ Draw it again'),
      !videoBtn.hidden && !page.noArt && el('button', {
        type: 'button',
        class: 'btn btn-small',
        onclick: () => {
          page.videoVersion = (page.videoVersion || 0) + 1;
          done('Making a new video…');
          startVideo(i);
        },
      }, '🎬 Make this video again'),
      el('label', { class: 'btn-plain btn-small picker-photo' },
        '📷 Use my own photo',
        el('input', {
          type: 'file',
          accept: 'image/*',
          onchange: async (e) => {
            try {
              page.photo = await shrink(e.target.files[0]);
              done('Photo added.');
            } catch {
              status.textContent = 'Could not read that photo. Try a different one.';
            }
          },
        }),
      ),
      el('p', { class: 'hint' }, 'Or pick a simple picture:'),
      el('div', { class: 'picker-grid' },
        Object.entries(PICTURES).map(([key, p]) =>
          el('button', {
            type: 'button',
            class: 'picker-btn',
            title: p.label,
            onclick: () => {
              page.picture = key;
              page.noArt = true;
              delete page.photo;
              done('Picture changed.');
            },
          }, el('img', { src: p.img, alt: '' }), el('span', {}, p.label)),
        ),
      ),
    );
    card.querySelector('.sb-body').append(picker);
    picker.querySelector('button')?.focus();
  }

  out.replaceChildren(...[
    story.sample && el('p', {}, el('span', { class: 'tag note' }, 'Sample story, AI is offline')),
    story.demo && el('p', {}, el('span', { class: 'tag note' }, `Demo story, made by VisitBridge for ${story.kidName}`)),
    el('div', { class: 'sb-head' },
      el('img', { class: 'sb-friend', src: friend.img, alt: '' }),
      el('div', {},
        el('h2', textAttrs, title),
        el('p', { class: 'sb-sub' }, `Told by ${friend.name} · ${story.pages.length} pages · ${tongue.name}`),
      ),
      el('div', { class: 'sb-head-actions no-print' },
        el('button', { type: 'button', class: 'btn btn-big', onclick: play }, '▶ Play the story'),
        videoBtn,
        remake && story.req && el('button', { type: 'button', class: 'btn-plain', onclick: () => remake(story.req) }, '↻ Make a new version'),
        el('button', { type: 'button', class: 'btn-plain', onclick: () => window.print() }, 'Print booklet'),
      ),
    ),
    story.plan?.length && planCard(story.plan),
    el('p', { class: 'hint no-print' }, 'Check each page before your child watches. Not right, or your child does not like it? Tap "Change picture" on a page, or "Make a new version" for a fresh story.'),
    status,
    el('ol', { class: 'storyboard' }, cards),
  ].filter(Boolean));

  cards.forEach((_, i) => drawCard(i));
  drawStory(story, kid, (i) => refresh(i));
  return { play };
}

async function shrink(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, PHOTO_SIZE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.75);
}
