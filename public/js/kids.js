import { el, post, showError } from './dom.js';
import { FRIENDS, DEFAULT_FRIEND, picture } from './pictures.js';
import { openStory, loadStories, saveStory, deleteStory } from './story.js';
import { friendOf } from './player.js';
import { deleteAllArt } from './art.js';
import { ACTIVITIES, TOP_ACTIVITIES, activity } from './activities.js';
import { LANGUAGES, TOP_LANGUAGES, AI_VOICE, language } from './languages.js';
import { FEARS } from './fears.js';
import { initVoicePicker, forgetVoice } from './voice.js';

const KID_KEY = 'vb-kid';

const SENSORY = [
  { id: 'loud', me: 'Loud sounds', emoji: '🔊' },
  { id: 'light', me: 'Bright lights', emoji: '💡' },
  { id: 'touched', me: 'Being touched', emoji: '✋' },
  { id: 'wait', me: 'Waiting', emoji: '⏳' },
  { id: 'needle', me: 'Needles', emoji: '💉' },
  { id: 'new', me: 'New places and people', emoji: '🚪' },
  { id: 'clothes', me: 'Taking clothes off', emoji: '👕' },
  { id: 'smell', me: 'Strong smells', emoji: '👃' },
];

const TIPS = [
  { id: 'talk', staff: 'Please talk to my child, not only to me.' },
  { id: 'show', staff: 'Show and tell before you touch: "I am going to touch your arm now."' },
  { id: 'count', staff: 'Give a countdown before you start: "3, 2, 1."' },
  { id: 'words', staff: 'My child may not answer with words. Ask me, or ask yes or no questions.' },
  { id: 'move', staff: 'My child may cover their ears, rock, or move around. This helps them stay calm.' },
  { id: 'comfort', staff: 'Please let my child keep their comfort item.' },
  { id: 'lap', staff: 'My child may do better sitting on my lap.' },
  { id: 'quiet', staff: 'A quiet room and fewer people in the room helps a lot.' },
  { id: 'early', staff: 'Waiting is very hard. Please see us as soon as you can.' },
];

const THEMES = [
  ['Lawn mowers', 'tractor'], ['Trains', 'train'], ['Dinosaurs', 'dinosaur'], ['Space', 'rocket'],
  ['Fire trucks', 'firetruck'], ['Dogs', 'dog'], ['Unicorns', 'unicorn'], ['Sharks', 'shark'],
  ['Robots', 'robot'], ['Race cars', 'racecar'],
];

const LOOK = {
  skin: [['light', '#f6d7c3'], ['light-medium', '#e3b48f'], ['medium', '#c18a5f'], ['medium-dark', '#8d5a3b'], ['dark', '#5a3825']],
  hair: [['short', 'Short'], ['long', 'Long'], ['curly', 'Curly'], ['braids', 'Braids'], ['buzz', 'Buzz cut']],
  hairColor: [['black', '#1f1a17'], ['brown', '#6b4428'], ['blonde', '#e2c070'], ['red', '#b5512b']],
};

const EMPTY = { name: '', age: '6-8', favorite: '', comfort: '', sensory: [], tips: [], look: {} };

export function loadKid() {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem(KID_KEY) || '{}') };
  } catch {
    return { ...EMPTY };
  }
}

export function hasKid() {
  const kid = loadKid();
  return Boolean(kid.favorite || kid.comfort || kid.sensory.length || kid.tips.length);
}

export function initKids() {
  initKidForm();
  initStory();
}

/* Kid profile */

function initKidForm() {
  const form = document.getElementById('kid-form');
  const status = document.getElementById('kid-status');

  form.querySelector('[data-kid-list="sensory"]').replaceChildren(
    ...SENSORY.map((o) => el('label', { class: 'toggle' },
      el('input', { type: 'checkbox', name: 'sensory', value: o.id }),
      el('span', {}, el('b', { 'aria-hidden': 'true' }, o.emoji), o.me),
    )),
  );
  form.querySelector('[data-kid-list="tips"]').replaceChildren(
    ...TIPS.map((o) => el('label', { class: 'toggle' }, el('input', { type: 'checkbox', name: 'tips', value: o.id }), el('span', {}, o.staff))),
  );

  form.querySelector('[data-look="skin"]').replaceChildren(
    ...LOOK.skin.map(([value, color]) => el('label', { class: 'swatch', title: value },
      el('input', { type: 'radio', name: 'skin', value, 'aria-label': `Skin tone ${value}` }),
      el('span', { style: `background:${color}` }),
    )),
  );
  form.querySelector('[data-look="hair"]').replaceChildren(
    ...LOOK.hair.map(([value, label]) => el('label', {}, el('input', { type: 'radio', name: 'hair', value }), el('span', {}, label))),
  );
  form.querySelector('[data-look="hairColor"]').replaceChildren(
    ...LOOK.hairColor.map(([value, color]) => el('label', { class: 'swatch', title: value },
      el('input', { type: 'radio', name: 'hairColor', value, 'aria-label': `Hair color ${value}` }),
      el('span', { style: `background:${color}` }),
    )),
  );

  fillKid(form, loadKid());
  const voiceBox = form.querySelector('[data-voice]');
  initVoicePicker(voiceBox);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const kid = {
      name: data.get('name').trim(),
      age: data.get('age'),
      favorite: data.get('favorite').trim(),
      comfort: data.get('comfort').trim(),
      sensory: data.getAll('sensory'),
      tips: data.getAll('tips'),
      look: {
        style: data.get('style') || 'real',
        skin: data.get('skin') || undefined,
        hair: data.get('hair') || undefined,
        hairColor: data.get('hairColor') || undefined,
        glasses: data.get('glasses') === 'on',
      },
    };
    localStorage.setItem(KID_KEY, JSON.stringify(kid));
    status.textContent = 'Saved on this phone. Next, make a visit story.';
    setTimeout(() => (location.hash = '#story'), 900);
  });

  document.getElementById('kid-clear').addEventListener('click', async () => {
    if (!confirm('Delete your child\'s details, saved stories, pictures, videos, and any recorded voice?')) return;
    localStorage.removeItem(KID_KEY);
    localStorage.removeItem('vb-stories');
    deleteAllArt();
    await forgetVoice();
    fillKid(form, EMPTY);
    initVoicePicker(voiceBox);
    status.textContent = 'Deleted.';
  });
}

function fillKid(form, kid) {
  for (const key of ['name', 'favorite', 'comfort']) form.elements[key].value = kid[key];
  form.elements.age.value = kid.age;
  for (const box of form.querySelectorAll('[name="sensory"]')) box.checked = kid.sensory.includes(box.value);
  for (const box of form.querySelectorAll('[name="tips"]')) box.checked = kid.tips.includes(box.value);
  const look = kid.look || {};
  for (const key of ['skin', 'hair', 'hairColor']) {
    for (const radio of form.querySelectorAll(`[name="${key}"]`)) radio.checked = radio.value === look[key];
  }
  form.elements.glasses.checked = Boolean(look.glasses);
  form.elements.style.value = look.style || 'real';
}

/* Visit story */

function initStory() {
  const form = document.getElementById('story-form');
  const out = document.getElementById('story-result');
  const other = form.querySelector('[data-other]');
  const themeOther = form.querySelector('[data-theme-other]');

  document.getElementById('fear-tiles').replaceChildren(
    ...FEARS.map((f) => el('label', { class: 'toggle' },
      el('input', { type: 'checkbox', name: 'fears', value: f.id }),
      el('span', {}, el('b', { 'aria-hidden': 'true' }, f.emoji), f.label),
    )),
  );

  const tile = (a) => pickTile('visitType', a.value, a.label, picture(a.pic).img);
  document.getElementById('visit-tiles').replaceChildren(...TOP_ACTIVITIES.filter((a) => a.kind === 'visit').map(tile));
  document.getElementById('routine-tiles').replaceChildren(...TOP_ACTIVITIES.filter((a) => a.kind === 'routine').map(tile));

  const more = document.getElementById('visit-more');
  const rest = ACTIVITIES.filter((a) => !a.top);
  more.replaceChildren(
    el('option', { value: '' }, 'Choose…'),
    el('optgroup', { label: 'Doctor and hospital' }, rest.filter((a) => a.kind === 'visit').map((a) => el('option', { value: a.value }, a.label))),
    el('optgroup', { label: 'Everyday life' }, rest.filter((a) => a.kind === 'routine').map((a) => el('option', { value: a.value }, a.label))),
    el('option', { value: 'other' }, 'Something else (type it)'),
  );

  const langMore = document.getElementById('lang-more');
  const langHint = document.getElementById('lang-hint');
  const lastLang = language(localStorage.getItem('vb-lang') || 'en');
  document.getElementById('lang-row').replaceChildren(
    ...TOP_LANGUAGES.map((l) => el('label', {},
      el('input', { type: 'radio', name: 'lang', value: l.code, checked: l.code === lastLang.code }),
      el('span', { lang: l.tag }, l.name),
    )),
  );
  langMore.replaceChildren(
    el('option', { value: '' }, 'Choose another language…'),
    ...LANGUAGES.slice(TOP_LANGUAGES.length).map((l) => el('option', { value: l.code, lang: l.tag }, `${l.name} · ${l.en}`)),
  );
  if (!TOP_LANGUAGES.includes(lastLang)) langMore.value = lastLang.code;
  const pickedLang = () => language(langMore.value || new FormData(form).get('lang') || 'en');
  const showLangHint = () => {
    const l = pickedLang();
    const notes = [];
    if (!['en', 'es'].includes(l.code)) notes.push(`Ask someone who reads ${l.en} to check the words before your child watches.`);
    if (!AI_VOICE.includes(l.code)) notes.push(`${l.en} uses your device's own voice.`);
    langHint.textContent = notes.join(' ');
  };
  showLangHint();
  document.getElementById('friend-tiles').replaceChildren(
    pickTile('theme', '', DEFAULT_FRIEND.name, FRIENDS.owl.img),
    ...THEMES.map(([value, key]) => pickTile('theme', value, value, FRIENDS[key].img)),
    pickTile('theme', 'other', 'Something else', '/img/3d/favorite.png'),
  );

  form.addEventListener('change', (event) => {
    if (event.target.name === 'visitType') {
      more.value = '';
      other.hidden = true;
    }
    if (event.target === more) {
      for (const r of form.querySelectorAll('[name="visitType"]')) r.checked = false;
      other.hidden = more.value !== 'other';
      if (!other.hidden) other.querySelector('input').focus();
    }
    if (event.target.name === 'lang') langMore.value = '';
    if (event.target === langMore) {
      for (const r of form.querySelectorAll('[name="lang"]')) r.checked = langMore.value ? false : r.value === 'en';
    }
    if (event.target.name === 'lang' || event.target === langMore) showLangHint();
    if (event.target.name === 'theme') {
      form.dataset.themeTouched = '1';
      themeOther.hidden = event.target.value !== 'other';
      if (!themeOther.hidden) themeOther.querySelector('input').focus();
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const choice = data.get('visitMore') || data.get('visitType');
    const visitType = choice === 'other' ? data.get('otherType').trim() : choice;
    if (!visitType) return showError(out, 'Pick what the story is about first.');
    const themeChoice = data.get('theme') ?? '';
    const theme = themeChoice === 'other' ? data.get('themeOther').trim() : themeChoice;
    const lang = pickedLang().code;
    localStorage.setItem('vb-lang', lang);

    const kid = loadKid();
    makeStory({
      visitType,
      kind: activity(visitType)?.kind,
      details: data.get('details'),
      fears: data.getAll('fears'),
      fearText: data.get('fearText'),
      theme,
      lang,
      age: kid.age,
      favorite: theme ? theme.toLowerCase() : kid.favorite,
      comfort: kid.comfort,
      sensory: SENSORY.filter((s) => kid.sensory.includes(s.id)).map((s) => s.me),
      helps: TIPS.filter((t) => kid.tips.includes(t.id)).map((t) => t.staff),
    });
  });
}

// req is everything the story was made from (never the child's name), so
// "Make a new version" can ask again.
async function makeStory(req) {
  const out = document.getElementById('story-result');
  const button = document.querySelector('#story-form [type="submit"]');
  const kid = loadKid();
  button.disabled = true;
  const stopLoading = showMaking(out, req.theme);
  out.scrollIntoView({ block: 'start' });

  try {
    const story = await post('/api/story', req);
    const saved = saveStory({ ...story, lang: req.lang, req });
    stopLoading();
    const view = openStory(out, saved, storyTitle(saved.title), kid, { remake: makeStory });
    out.scrollIntoView({ block: 'start' });
    renderSaved();
    view.play();
  } catch (err) {
    stopLoading();
    showError(out, err.message);
    const sample = err.body?.sample;
    if (sample) {
      out.append(el('button', {
        type: 'button',
        class: 'btn-big',
        onclick: () => openStory(out, sample, storyTitle(sample.title), kid).play(),
      }, '▶ Watch the sample story'));
    }
  } finally {
    button.disabled = false;
  }
}

function pickTile(name, value, label, img) {
  return el('label', { class: 'pick' },
    el('input', { type: 'radio', name, value }),
    el('span', {}, el('img', { src: img, alt: '' }), el('b', {}, label)),
  );
}

// A friendly loading screen. Writing takes about 20 seconds.
function showMaking(out, theme) {
  const key = THEMES.find(([name]) => name === theme)?.[1];
  const friend = key ? FRIENDS[key] : FRIENDS.owl;
  const steps = ['Planning the visit, step by step…', 'Writing the words…', 'Making it fun…', 'Checking it is honest and calm…', 'Almost ready…'];
  const line = el('span', {}, steps[0]);
  out.replaceChildren(
    el('div', { class: 'making', role: 'status' },
      el('img', { src: friend.img, alt: '' }),
      el('div', {}, el('strong', {}, 'Making your story'), line, el('div', { class: 'making-bar' }, el('i'))),
    ),
  );
  let i = 0;
  const timer = setInterval(() => {
    i = Math.min(i + 1, steps.length - 1);
    line.textContent = steps[i];
  }, 4500);
  return () => clearInterval(timer);
}

export function refreshStoryView() {
  const kid = loadKid();
  const form = document.getElementById('story-form');
  if (!form.dataset.themeTouched) {
    const match = THEMES.find(([name]) => name.toLowerCase().replace(/s$/, '') === kid.favorite.toLowerCase().replace(/s$/, ''));
    if (match) form.elements.theme.value = match[0];
    else if (kid.favorite) {
      form.elements.theme.value = 'other';
      form.elements.themeOther.value = kid.favorite;
      form.querySelector('[data-theme-other]').hidden = false;
    } else form.elements.theme.value = '';
  }
  const hint = document.getElementById('story-hint');
  if (kid.comfort || kid.sensory.length) {
    hint.textContent = `Made for ${kid.name || 'your child'}${kid.comfort ? `, with their ${kid.comfort}` : ''}.`;
  } else {
    hint.replaceChildren('Tip: fill in ', el('a', { href: '#child' }, 'About your child'), ' so the story fits them.');
  }
  renderSaved();
}

function storyTitle(title) {
  const { name } = loadKid();
  return name ? title.replace(/NAME/g, name) : title.replace(/NAME('s)?\s*/g, '').replace(/^\w/, (c) => c.toUpperCase());
}

function renderSaved() {
  const box = document.getElementById('story-saved');
  const list = loadStories();
  if (!list.length) return box.replaceChildren();

  const open = (s) => {
    const out = document.getElementById('story-result');
    const view = openStory(out, s, storyTitle(s.title), loadKid(), { remake: makeStory });
    out.scrollIntoView({ block: 'start' });
    return view;
  };

  box.replaceChildren(
    el('h2', {}, 'Saved stories'),
    el('ul', { class: 'saved' },
      list.map((s) =>
        el('li', {},
          el('img', { src: friendOf(s).img, alt: '' }),
          el('span', {}, storyTitle(s.title)),
          el('button', { type: 'button', class: 'btn btn-small', onclick: () => open(s).play() }, '▶ Play'),
          el('button', { type: 'button', class: 'btn-plain btn-small', onclick: () => open(s) }, 'Edit'),
          el('button', {
            type: 'button',
            class: 'btn-plain btn-small danger',
            onclick: () => {
              deleteStory(s.id);
              renderSaved();
            },
          }, 'Delete'),
        ),
      ),
    ),
  );
}
