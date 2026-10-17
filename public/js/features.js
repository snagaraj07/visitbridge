// Which optional services this server has: ai, video, clone.
let checked;

export function features() {
  checked ??= fetch('/api/health')
    .then((res) => res.json())
    .catch(() => ({}));
  return checked;
}
