import { el, post } from './dom.js';
import { PLAY_AGES, TALK_LEVELS, SKILLS, GAMES, GOALS, nextGame, good, evidence, skillPath } from './games.js';
import { FRIENDS, DEFAULT_FRIEND, friendFor } from './pictures.js';
import { language } from './languages.js';
import { loadKid } from './kids.js';
import { speak, stopSpeaking, canSpeak } from './speech.js';

const PLAY_KEY = 'vb-play';
const MINUTES = 5;
let box;
let timer = 0;

export function initPlay() {
  box = document.getElementById('play-app');
}

export function refreshPlay() {
  if (!box) return;
  const state = load();
  if (!state.age) return renderSetup(state);
  renderToday(state);
}

export function forgetPlay() {
  localStorage.removeItem(PLAY_KEY);
}

function load() {
  try {
    return { log: [], ...JSON.parse(localStorage.getItem(PLAY_KEY) || '{}') };
  } catch {
    return { log: [] };
  }
}

function save(state) {
  localStorage.setItem(PLAY_KEY, JSON.stringify(state));
}

const today = () => new Date().toLocaleDateString('en-CA');

/* Setup */

function renderSetup(state) {
  const kid = loadKid();
  const seg = (name, options, value) => el('div', { class: 'seg seg-wrap', role: 'radiogroup', 'aria-label': name },
    options.map((o) => el('label', {}, el('input', { type: 'radio', name, value: o.id, checked: o.id === value, required: true }), el('span', {}, o.label))));

  const form = el('form', { class: 'builder' },
    el('fieldset', { class: 'step' },
      el('legend', {}, el('span', { class: 'step-n' }, '1'), 'How old is your child?'),
      seg('age', PLAY_AGES, state.age),
    ),
    el('fieldset', { class: 'step' },
      el('legend', {}, el('span', { class: 'step-n' }, '2'), 'How do they talk now?'),
      el('p', { class: 'hint' }, 'Any answer is fine. We start where your child is.'),
      seg('talk', TALK_LEVELS, state.talk),
    ),
    el('fieldset', { class: 'step' },
      el('legend', {}, el('span', { class: 'step-n' }, '3'), 'What do they love?'),
      el('p', { class: 'hint' }, 'Every game is built around it, because kids connect best through what they already love.'),
      el('label', { class: 'field' },
        el('span', {}, 'Favorite thing'),
        el('input', { type: 'text', name: 'favorite', maxlength: 60, value: state.favorite ?? kid.favorite ?? '', placeholder: 'Trains, water, spinning things, music...' }),
      ),
    ),
    el('fieldset', { class: 'step' },
      el('legend', {}, el('span', { class: 'step-n' }, '4'), 'What do you want to work on?'),
      el('p', { class: 'hint' }, 'Pick 1 or 2. The games will work toward them, step by step.'),
      el('div', { class: 'toggles toggles-wide' }, GOALS.map((g) => el('label', { class: 'toggle' },
        el('input', { type: 'checkbox', name: 'goals', value: g.id, checked: state.goals?.includes(g.id) }),
        el('span', {}, el('b', { 'aria-hidden': 'true' }, g.emoji), g.label)))),
    ),
    el('div', { class: 'research', 'aria-live': 'polite' }),
    el('div', { class: 'actions' }, el('button', { type: 'submit', class: 'btn btn-big' }, 'Start playing')),
  );
  const research = form.querySelector('.research');
  const update = () => {
    const goals = new FormData(form).getAll('goals');
    const boxes = form.querySelectorAll('[name=goals]');
    boxes.forEach((b) => { b.disabled = !b.checked && goals.length >= 2; });
    research.replaceChildren(...researchFor(new FormData(form).get('age'), goals));
  };
  form.addEventListener('change', update);
  update();
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const next = { ...state, age: data.get('age'), talk: data.get('talk'), favorite: data.get('favorite').trim(), goals: data.getAll('goals'), today: null };
    save(next);
    renderToday(next);
  });
  box.replaceChildren(form, freeHelp());
}

// What research says about the plan for this child: the skills in order, and
// the studies behind them with how many children took part.
function researchFor(age, goals) {
  if (!age) return [];
  const path = skillPath(goals);
  const studies = [...new Map(path.flatMap(evidence).map((s) => [s.name, s])).values()];
  const kids = studies.reduce((sum, s) => sum + (s.kids ?? 0), 0);
  return [
    el('h3', {}, '📊 What research says for your child'),
    el('p', {}, `For children aged ${PLAY_AGES.find((a) => a.id === age).label}, these parent-led ways of playing have been tested in published studies`,
      kids ? `, with ${kids.toLocaleString()} children in the trials below, plus large reviews of many more.` : '.'),
    el('ol', { class: 'research-path' }, path.map((id) => {
      const s = SKILLS.find((k) => k.id === id);
      return el('li', {}, el('b', { 'aria-hidden': 'true' }, s.emoji), ` ${s.label}`);
    })),
    el('details', {},
      el('summary', {}, `See the ${studies.length} studies`),
      el('ul', { class: 'research-list' }, studies.map(studyItem)),
    ),
    el('p', { class: 'hint' }, 'These are results across groups of children. Every child is different, and your child may need a different pace.'),
  ];
}

function studyItem(s) {
  return el('li', {},
    el('b', {}, s.name),
    el('span', { class: 'research-meta' }, s.kids ? `${s.kids} children, ages ${s.ages}` : `Review, ${s.ages}`),
    el('span', {}, s.found),
  );
}

/* Today's game */

async function renderToday(state, { another = false } = {}) {
  clearInterval(timer);
  const kid = loadKid();
  const done = state.log.some((l) => l.date === today());
  const plan = nextGame(state.log, state.age, state.goals);
  let idea = state.today?.date === today() && !another ? state.today.game : null;

  const head = el('div', { class: 'play-head' },
    el('img', { src: friend(state).img, alt: '' }),
    el('div', {},
      el('p', { class: 'eyebrow' }, done ? 'Done for today' : 'Today\'s 5-minute game'),
      el('h2', {}, kid.name ? `Play time with ${kid.name}` : 'Play time'),
    ),
    el('button', { type: 'button', class: 'btn-plain btn-small', onclick: () => renderSetup(state) }, 'Change'),
  );
  const card = el('div', { class: 'play-card', 'aria-live': 'polite' }, el('p', { class: 'loading', role: 'status' }, 'Making today\'s game…'));
  box.replaceChildren(head, card, progress(state), freeHelp());

  if (!idea) {
    const base = another ? otherGame(plan.game, state) : plan.game;
    idea = await post('/api/play', {
      gameId: base.id, age: state.age, talk: state.talk, favorite: state.favorite, goals: state.goals,
      lang: localStorage.getItem('vb-lang') || 'en', gentle: plan.gentle,
    }).catch(() => ({ ...base, gentle: plan.gentle }));
    save({ ...state, today: { date: today(), game: idea } });
  }
  card.replaceChildren(...gameCard(idea, state, done).filter(Boolean));
}

function otherGame(current, state) {
  const same = GAMES.filter((g) => g.skill === current.skill && g.ages.includes(state.age) && g.id !== state.today?.game?.id);
  return same[Math.floor(Math.random() * same.length)] ?? current;
}

function gameCard(idea, state, done) {
  const skill = SKILLS.find((s) => s.id === idea.skill);
  const lang = language(localStorage.getItem('vb-lang') || 'en');
  const readable = [idea.title, `Get ready: ${idea.need}.`, ...idea.steps.map((s, i) => `Step ${i + 1}. ${s}`), `Look for this: ${idea.watch}`].join(' ');

  return [
    goalsFor(state, skill.id) && el('p', { class: 'play-goal' }, '🎯 Working toward: ', el('b', {}, goalsFor(state, skill.id))),
    el('p', { class: 'play-skill' }, el('b', { 'aria-hidden': 'true' }, skill.emoji), ` Skill: ${skill.label}. `, el('span', {}, skill.why)),
    idea.gentle && el('p', { class: 'nudge' }, 'Yesterday was hard, so today is gentler. Stopping after one minute is fine.'),
    el('h3', { class: 'play-title' }, idea.title),
    el('p', { class: 'play-need' }, el('b', {}, 'Get ready: '), idea.need),
    el('ol', { class: 'play-steps', lang: lang.tag }, idea.steps.map((s) => el('li', {}, s))),
    idea.say?.length && el('div', { class: 'play-say' }, el('b', {}, 'Words to say: '), idea.say.map((w) => el('span', { class: 'chip' }, w))),
    el('p', { class: 'play-watch' }, el('b', {}, '⭐ Look for this: '), idea.watch),
    el('details', { class: 'play-proof' },
      el('summary', {}, `📊 Has this worked for other kids? ${proofLine(skill.id)}`),
      el('ul', { class: 'research-list' }, evidence(skill.id).map(studyItem)),
    ),
    el('div', { class: 'actions' },
      !done && el('button', { type: 'button', class: 'btn btn-big', onclick: (e) => startTimer(e.currentTarget, idea, state) }, `▶ Start ${MINUTES} minutes`),
      done && el('p', { class: 'status' }, '✓ You played today. See you tomorrow!'),
      canSpeak && el('button', { type: 'button', class: 'btn-plain', onclick: () => speak(readable, lang.tag) }, '🔊 Read it to me'),
      !done && el('button', { type: 'button', class: 'btn-plain', onclick: () => renderToday(state, { another: true }) }, '↻ Another game'),
    ),
    el('p', { class: 'hint' }, 'Play on the floor, face to face. Stop while it is still fun. Any way your child reaches out counts.'),
  ];
}

function goalsFor(state, skill) {
  return GOALS.filter((g) => state.goals?.includes(g.id) && g.skills.includes(skill)).map((g) => g.label).join(' · ');
}

function proofLine(skill) {
  const kids = evidence(skill).reduce((sum, s) => sum + (s.kids ?? 0), 0);
  return kids ? `Tested with ${kids} children in trials.` : 'Rated evidence-based in a review of 972 studies.';
}

function startTimer(button, idea, state) {
  stopSpeaking();
  const end = Date.now() + MINUTES * 60_000;
  const actions = button.parentElement;
  const clock = el('p', { class: 'play-clock', role: 'timer', 'aria-live': 'off' });
  const stop = el('button', { type: 'button', class: 'btn btn-big', onclick: () => checkIn(idea, state) }, 'We are done');
  actions.replaceChildren(clock, stop);
  const tick = () => {
    const left = Math.max(0, end - Date.now());
    clock.textContent = `${Math.floor(left / 60_000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`;
    if (!left) {
      clearInterval(timer);
      clock.textContent = 'Time! Stop while it is still fun.';
    }
  };
  tick();
  timer = setInterval(tick, 1000);
}

/* How did it go */

function checkIn(idea, state) {
  clearInterval(timer);
  const q = (name, label, options) => el('fieldset', { class: 'step' },
    el('legend', {}, label),
    el('div', { class: 'seg seg-wrap', role: 'radiogroup' },
      options.map(([value, text]) => el('label', {}, el('input', { type: 'radio', name, value, required: true }), el('span', {}, text)))),
  );
  const form = el('form', { class: 'builder' },
    el('h3', {}, 'How did it go?'),
    el('p', { class: 'hint' }, 'Three taps. This picks tomorrow\'s game.'),
    q('looks', 'Did they look at you?', [['0', 'Not yet'], ['1', '1 or 2 times'], ['3', '3 or more']]),
    q('reached', 'Did they reach out to you? A sound, a reach, a word, bringing you something.', [['no', 'Not yet'], ['yes', 'Yes!']]),
    q('feel', 'How did it feel?', [['fun', '😀 Fun'], ['ok', '😐 OK'], ['hard', '😣 Hard']]),
    el('div', { class: 'actions' }, el('button', { type: 'submit', class: 'btn btn-big' }, 'Save')),
  );
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const entry = {
      date: today(), gameId: idea.id, skill: idea.skill,
      looks: Number(data.get('looks')), reached: data.get('reached') === 'yes', feel: data.get('feel'),
    };
    const next = { ...state, log: [...state.log.filter((l) => l.date !== entry.date), entry].slice(-180), today: null };
    save(next);
    renderToday(next).then(() => {
      box.querySelector('.play-card').prepend(el('p', { class: 'nudge', role: 'status' }, cheer(entry)));
    });
  });
  box.querySelector('.play-card').replaceChildren(form);
  form.querySelector('input').focus();
}

function cheer(entry) {
  if (entry.feel === 'hard') return 'Thank you for trying. Hard days are part of it. Tomorrow will be gentler.';
  if (entry.reached) return 'They reached out to you. That is a real step. 🎉';
  if (entry.looks) return 'They looked at you. Small moments like this add up. ⭐';
  return 'You showed up and played. That is what matters most.';
}

/* Progress */

function progress(state) {
  const log = state.log;
  if (!log.length) return el('section', { class: 'play-progress' }, el('h2', {}, 'Your progress'), el('p', { class: 'hint' }, 'After your first game, small wins show up here.'));

  const days = [...Array(14)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = d.toLocaleDateString('en-CA');
    return { key, entry: log.find((l) => l.date === key), label: d.toLocaleDateString(undefined, { weekday: 'narrow' }) };
  });
  const week = days.slice(-7).map((d) => d.entry).filter(Boolean);
  const { stars, game: current, path } = nextGame(log, state.age, state.goals);

  return el('section', { class: 'play-progress' },
    el('h2', {}, 'Your progress'),
    el('div', { class: 'play-stats' },
      stat(`${week.length} of 7`, 'days played this week'),
      stat(String(week.filter((e) => e.reached).length), 'times they reached out this week'),
      stat(String(log.filter(good).length), 'good games in total'),
    ),
    el('div', { class: 'play-days', role: 'img', 'aria-label': `Last 14 days: played on ${days.filter((d) => d.entry).length} days` },
      days.map((d) => el('span', { class: `day ${d.entry ? (good(d.entry) ? 'good' : 'played') : ''}`, title: d.key }, el('i'), d.label))),
    el('ol', { class: 'play-ladder' }, SKILLS.filter((s) => path.includes(s.id)).map((s) => el('li', { class: stars[s.id] >= 3 ? 'done' : s.id === current.skill ? 'now' : '' },
      el('b', { 'aria-hidden': 'true' }, s.emoji), el('span', {}, s.label),
      el('span', { class: 'stars', 'aria-label': `${Math.min(3, stars[s.id])} of 3 stars` }, '★'.repeat(Math.min(3, stars[s.id])) + '☆'.repeat(Math.max(0, 3 - stars[s.id])))))),
    el('div', { class: 'actions' },
      el('button', { type: 'button', class: 'btn-plain', onclick: (e) => copySummary(state, e.currentTarget) }, '📋 Copy a summary for your doctor or therapist'),
    ),
  );
}

function stat(value, label) {
  return el('div', { class: 'stat' }, el('strong', {}, value), el('span', {}, label));
}

async function copySummary(state, button) {
  const kid = loadKid();
  const log = state.log;
  const first = log[0]?.date;
  const lines = [
    `Play log${kid.name ? ` for ${kid.name}` : ''} (VisitBridge Play Coach), ${first} to ${today()}`,
    `Age group: ${state.age} years. Talk level: ${TALK_LEVELS.find((t) => t.id === state.talk)?.label}.`,
    state.goals?.length && `Goals: ${GOALS.filter((g) => state.goals.includes(g.id)).map((g) => g.label).join('; ')}.`,
    `Days played: ${log.length}. Good games: ${log.filter(good).length}. Days they reached out: ${log.filter((l) => l.reached).length}. Hard days: ${log.filter((l) => l.feel === 'hard').length}.`,
    '',
    ...SKILLS.map((s) => {
      const of = log.filter((l) => l.skill === s.id);
      return of.length ? `${s.label}: ${of.length} days, looked at parent on ${of.filter((l) => l.looks).length}, reached out on ${of.filter((l) => l.reached).length}.` : null;
    }).filter(Boolean),
    '',
    'Recorded by a parent at home. Not a clinical assessment.',
  ].filter((l) => l !== false && l != null);
  try {
    await navigator.clipboard.writeText(lines.join('\n'));
    button.textContent = '✓ Copied. Paste it in a message or patient portal.';
  } catch {
    button.replaceWith(el('pre', { class: 'play-summary' }, lines.join('\n')));
  }
}

/* Free help */

function freeHelp() {
  const link = (href, text) => el('a', { href, target: '_blank', rel: 'noopener noreferrer' }, text);
  return el('aside', { class: 'play-help' },
    el('h2', {}, 'Waiting for help? You can ask for a free evaluation now'),
    el('p', {}, 'In the US, every child under 3 can get a free early intervention evaluation, and help at home if they qualify. You do not need a diagnosis or a doctor\'s referral. You can call yourself.'),
    el('p', {}, 'Age 3 and older: ask your local public school district for a free evaluation for preschool services.'),
    el('p', {}, link('https://ectacenter.org/contact/ptccoord.asp', 'Find your state\'s early intervention program'), ' · ', link('https://www.cdc.gov/act-early/', 'CDC: Learn the Signs. Act Early.')),
    el('p', { class: 'hint' }, 'Play Coach is not therapy and not medical advice. It helps you play in ways research shows can help, while you wait and alongside any care your child gets.'),
  );
}

function friend(state) {
  const key = state.favorite && friendFor(state.favorite);
  return FRIENDS[key] ?? FRIENDS[DEFAULT_FRIEND.key];
}
