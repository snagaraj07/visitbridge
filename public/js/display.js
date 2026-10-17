const KEY = 'vb-display';
const root = document.documentElement;

export function initDisplay() {
  const button = document.getElementById('display-btn');
  const panel = document.getElementById('display');
  const saved = load();

  const toggles = {
    contrast: document.getElementById('opt-contrast'),
    dark: document.getElementById('opt-dark'),
    spaced: document.getElementById('opt-spacing'),
    calm: document.getElementById('opt-motion'),
  };

  if (saved.calm === undefined) saved.calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (saved.dark === undefined) saved.dark = false;

  for (const [key, input] of Object.entries(toggles)) {
    input.checked = Boolean(saved[key]);
    input.addEventListener('change', () => {
      saved[key] = input.checked;
      apply(saved);
    });
  }

  for (const radio of panel.querySelectorAll('[name="size"]')) {
    radio.checked = radio.value === (saved.size || 'normal');
    radio.addEventListener('change', () => {
      saved.size = radio.value;
      apply(saved);
    });
  }

  button.addEventListener('click', () => {
    const open = panel.hidden;
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  });

  apply(saved);
}

function apply(settings) {
  root.classList.remove('size-large', 'size-xlarge');
  if (settings.size === 'large') root.classList.add('size-large');
  if (settings.size === 'xlarge') root.classList.add('size-xlarge');
  root.classList.toggle('contrast', Boolean(settings.contrast));
  root.classList.toggle('dark', Boolean(settings.dark));
  root.classList.toggle('spaced', Boolean(settings.spaced));
  root.classList.toggle('calm', Boolean(settings.calm));
  localStorage.setItem(KEY, JSON.stringify(settings));
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}
