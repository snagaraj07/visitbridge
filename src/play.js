import { InputError, runModel, str, strs } from './ai.js';
import { scrub } from './scrub.js';
import { game, PLAY_AGES, TALK_LEVELS, SKILLS, GOALS } from '../public/js/games.js';
import { LANGUAGES } from '../public/js/languages.js';

const AGE_IDS = PLAY_AGES.map((a) => a.id);

const SYSTEM = `You coach parents of young autistic children through one short play game a day. The games come from parent-led, play-based approaches with strong research (PACT, ESDM, JASPER, Hanen "More Than Words"). You get one tested game. Rewrite it so it is built around the child's favorite thing, and keep what makes it work.

Rules:
- Start from the game's own steps and change as little as possible: swap in the favorite thing and keep each sentence about as long as it was. Do not shorten them.
- Keep the same skill and the same purpose for every step. Do not add new teaching ideas.
- 3 to 5 steps, written for the parent. Each step is one complete, warm sentence of 10 to 18 words, in plain words a tired parent can read in a few seconds. Say exactly what to do and with what. Example: "Roll the toy train toward your child slowly and say "go!" with a big smile."
- Only "say" matches the child's talk level. The steps are normal adult sentences.
- Use real things a family has at home. If the favorite thing is not something you can hold, like trains, use a toy of it, a picture of it, or sounds of it.
- Warm and gentle. The child leads, the parent follows. Any way of asking counts: a look, a sound, a reach, a sign, a word.
- Never force eye contact, never hold the child's face or body still, never take away a toy as a punishment, never make the child repeat a word.
- Safety: for children under 3, no small objects, coins, marbles, balloons, button batteries, or strings. Water play only with the grown-up right there.
- No medical claims. Do not promise results.
- "title": short and fun, under 6 words, using the favorite thing.
- "say": 2 or 3 words or tiny phrases the parent says, at the child's talk level.
- "watch": the small win to look for, one sentence.
- "need": what to get ready, under 12 words.
- Return only JSON that matches the schema.`;

const GENTLE = 'Yesterday was hard for the child. Make it easier: shorter, calmer, fewer steps, and fine to stop after one minute.';

const SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    need: { type: 'string' },
    steps: { type: 'array', items: { type: 'string' } },
    say: { type: 'array', items: { type: 'string' } },
    watch: { type: 'string' },
  },
  required: ['title', 'need', 'steps', 'say', 'watch'],
};

export async function playIdea(env, body) {
  const base = game(str(body.gameId, 40));
  if (!base) throw new InputError('Unknown game.');
  const age = AGE_IDS.includes(body.age) ? body.age : '2-3';
  const talk = TALK_LEVELS.find((t) => t.id === body.talk) ?? TALK_LEVELS[0];
  const favorite = scrub(str(body.favorite, 60)).text;
  const lang = LANGUAGES.find((l) => l.code === body.lang) ?? LANGUAGES[0];
  const gentle = body.gentle === true;
  const skill = SKILLS.find((s) => s.id === base.skill);
  const goals = GOALS.filter((g) => Array.isArray(body.goals) && body.goals.includes(g.id)).map((g) => g.label.toLowerCase());

  const fallback = { ...pick(base), gentle, themed: false };
  if (!favorite && lang.code === 'en' && !gentle) return json(fallback);

  const user = [
    `Child's age: ${age} years`,
    `Talk level: ${talk.label}. Use ${talk.words}.`,
    favorite && `Favorite thing: ${favorite}`,
    `Skill: ${skill.label}. ${skill.why}`,
    goals.length && `The parent is working toward: ${goals.join('; ')}. Point the game toward this where it fits naturally.`,
    `Game: ${JSON.stringify(pick(base))}`,
    gentle && GENTLE,
    lang.code === 'en' ? 'Write in English.' : `Write everything in ${lang.en}, in simple words a parent uses at home.`,
  ].filter(Boolean).join('\n');

  const raw = await runModel(env, SYSTEM, user, SCHEMA);
  // Choppy steps like "Stop train near face." are hard to follow; the tested wording is better.
  const words = (s) => s.split(/\s+/).length;
  const themed = strs(raw?.steps, 5).map((s) => s.slice(0, 160));
  if (!raw || themed.length < 2) return json(fallback);
  const steps = themed.some((s) => words(s) < 6) ? base.steps : themed;
  return json({
    id: base.id,
    skill: base.skill,
    title: str(raw.title, 60) || base.title,
    need: str(raw.need, 120) || base.need,
    steps,
    say: strs(raw.say, 3).map((s) => s.slice(0, 40)),
    watch: str(raw.watch, 200) || base.watch,
    gentle,
    themed: true,
  });
}

function pick({ id, skill, title, need, steps, say, watch }) {
  return { id, skill, title, need, steps, say, watch };
}

function json(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
  });
}
