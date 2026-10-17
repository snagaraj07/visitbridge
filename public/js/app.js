import { initDisplay } from './display.js';
import { initKids, hasKid, refreshStoryView } from './kids.js';
import { stopSpeaking } from './speech.js';
import { initDemos } from './demos.js';

const views = [...document.querySelectorAll('[data-view]')];
const navLinks = [...document.querySelectorAll('.top-nav a')];

function route() {
  const name = location.hash.slice(1) || 'home';
  const view = views.find((v) => v.dataset.view === name) ?? views[0];

  for (const v of views) v.hidden = v !== view;
  for (const a of navLinks) {
    if (a.getAttribute('href') === `#${view.dataset.view}`) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }

  document.title = view.dataset.title ? `${view.dataset.title} | VisitBridge` : 'VisitBridge';
  stopSpeaking();

  if (view.dataset.view === 'home') document.getElementById('child-nudge').hidden = hasKid();
  if (view.dataset.view === 'story') refreshStoryView();

  window.scrollTo(0, 0);
  view.querySelector('h1')?.focus({ preventScroll: true });
}

initDisplay();
initKids();
initDemos();

document.getElementById('skip').addEventListener('click', (event) => {
  event.preventDefault();
  document.getElementById('main').focus();
});

window.addEventListener('hashchange', route);
route();
