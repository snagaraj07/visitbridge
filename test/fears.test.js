import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeStory } from '../src/ai.js';

const page = (over = {}) => ({ text: 'I sit in the chair.', fun: 'It leans back.', say: 'Ooh, NAME! [giggles] Here we go.', scene: 'The child sits.', sound: '', picture: 'chair', ...over });

function fakeEnv(response) {
  const env = { calls: [], AI: { run: async (model, input) => { env.calls.push(input); return { response }; } } };
  return env;
}

test('builds the parent plan from the library, plus what the AI matched from the parent\'s words', async () => {
  const env = fakeEnv({ title: 'NAME at the dentist', pages: [page()], friendLook: 'an owl', fears: ['mouth', 'not-a-fear'] });
  const story = await writeStory(env, { visitType: 'Dental cleaning', fears: ['noise'], fearText: 'he gags on the tools' });
  assert.deepEqual(story.plan.map((f) => f.id), ['noise', 'mouth']);
  assert.ok(story.plan[0].ask.length > 0);
  const { content } = env.calls[0].messages[0];
  assert.match(content, /Fear rules/);
  assert.match(env.calls[0].messages[1].content, /Ways that help: wear headphones/);
});

test('keeps known voice cues and drops made-up ones', async () => {
  const env = fakeEnv({ title: 'T', pages: [page({ say: 'Hmm... [Giggles] hi NAME [dances] ok' })], friendLook: 'an owl' });
  const story = await writeStory(env, { visitType: 'Bath time' });
  assert.equal(story.pages[0].say, 'Hmm... [giggles] hi NAME  ok');
  assert.doesNotMatch(story.pages[0].text, /\[/);
});

test('no fear rules when the parent picked none', async () => {
  const env = fakeEnv({ title: 'T', pages: [page()], friendLook: 'an owl' });
  const story = await writeStory(env, { visitType: 'Bath time' });
  assert.deepEqual(story.plan, []);
  assert.doesNotMatch(env.calls[0].messages[0].content, /Fear rules/);
});
