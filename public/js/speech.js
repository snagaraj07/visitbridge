export const canSpeak = 'speechSynthesis' in window;

// The device voice for a BCP 47 tag like "hi-IN", or null when the device
// has none. A voice for another region of the same language is fine.
export function deviceVoice(tag = 'en-US') {
  if (!canSpeak) return null;
  const all = speechSynthesis.getVoices();
  const want = tag.toLowerCase();
  const base = want.split('-')[0];
  return all.find((v) => v.lang.toLowerCase().replace('_', '-') === want)
    ?? all.find((v) => v.lang.toLowerCase().split(/[-_]/)[0] === base)
    ?? null;
}

// onWord gets the character index of each word as it is spoken, onEnd fires
// once at the end. Not every browser voice sends word events.
export function speak(text, lang = 'en-US', { onWord, onEnd } = {}) {
  if (!canSpeak || !text) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const tag = lang === 'es' ? 'es-US' : lang === 'en' ? 'en-US' : lang;
  utterance.lang = tag;
  const voice = deviceVoice(tag);
  if (voice) utterance.voice = voice;
  utterance.rate = 0.9;
  if (onWord) utterance.addEventListener('boundary', (e) => e.name === 'word' && onWord(e.charIndex));
  if (onEnd) utterance.addEventListener('end', onEnd);
  speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (canSpeak) speechSynthesis.cancel();
}
