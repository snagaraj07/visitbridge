// Ready-made demo stories in /demo/, with their pictures, clips, and voice
// as files. Made with dev/make-demo.mjs (npm run demo). They play without calling any AI.
import { el } from './dom.js';
import { openStory } from './story.js';

export async function initDemos() {
  const box = document.getElementById('demo-list');
  const list = await fetch('/demo/index.json').then((r) => (r.ok ? r.json() : [])).catch(() => []);
  if (!list.length) return;

  box.replaceChildren(
    el('h2', {}, 'Watch a demo'),
    el('p', { class: 'hint' }, 'Stories made ahead of time for the hardest visits. Tap one to watch it full screen.'),
    el('div', { class: 'demo-grid' }, list.map((d) =>
      el('button', { type: 'button', class: 'demo-card', onclick: () => openDemo(d.id) },
        el('span', { class: 'demo-cover' },
          d.cover && el('img', { src: `/demo/${d.id}/${d.cover}`, alt: '' }),
          d.videos > 0 && el('span', { class: 'demo-badge' }, '🎬 Video'),
        ),
        el('b', {}, d.title),
        el('span', { class: 'demo-sub' }, `${d.label} · told by ${d.friend}`),
      ))),
  );
  box.hidden = false;
  const link = document.getElementById('watch-demo');
  link.hidden = false;
  link.addEventListener('click', () => setTimeout(() => box.scrollIntoView({ block: 'start' }), 50));
}

export async function openDemo(id) {
  const story = await fetch(`/demo/${id}/story.json`).then((r) => r.json());
  Object.assign(story, { demo: true, base: `/demo/${id}/` });
  const out = document.getElementById('story-result');
  const view = openStory(out, story, story.title, { name: story.kidName, age: story.age, look: {} });
  out.scrollIntoView({ block: 'start' });
  view.play();
}
