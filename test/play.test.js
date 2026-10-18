import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GAMES, SKILLS, SKILL_IDS, PLAY_AGES, GOALS, nextGame, evidence, skillPath } from '../public/js/games.js';
import worker from '../src/worker.js';

const AGES = PLAY_AGES.map((a) => a.id);

test('every skill has games for every age', () => {
  for (const skill of SKILL_IDS) {
    for (const age of AGES) {
      assert.ok(GAMES.some((g) => g.skill === skill && g.ages.includes(age)), `${skill} has no game for ${age}`);
    }
  }
  assert.equal(new Set(GAMES.map((g) => g.id)).size, GAMES.length);
});

test('games never ask the parent to force the child', () => {
  const all = JSON.stringify(GAMES).toLowerCase();
  for (const bad of ['make him', 'make her', 'force', 'hold their face', 'look at me', 'punish', 'take away']) {
    assert.ok(!all.includes(bad), `found "${bad}"`);
  }
});

test('starts with following the lead, then moves on after 3 good days', () => {
  assert.equal(nextGame([], '1-2').game.skill, 'lead');
  const goodDay = (skill, i) => ({ date: `2026-01-0${i}`, skill, gameId: 'x', looks: 1, reached: true, feel: 'fun' });
  const log = [1, 2, 3].map((i) => goodDay('lead', i));
  assert.equal(nextGame(log, '2-3').game.skill, 'copy');
});

test('a hard day repeats the same skill, gently', () => {
  const log = [{ date: '2026-01-01', skill: 'copy', gameId: 'copy-twin', looks: 0, reached: false, feel: 'hard' }];
  const plan = nextGame(log, '2-3');
  assert.equal(plan.game.skill, 'copy');
  assert.equal(plan.gentle, true);
});

test('every skill has research behind it, and every goal uses real skills', () => {
  for (const s of SKILLS) assert.ok(evidence(s.id).length && evidence(s.id).every((e) => e.name && e.found), s.id);
  for (const g of GOALS) assert.ok(g.skills.every((id) => SKILL_IDS.includes(id)), g.id);
});

test('goals choose which skills come up', () => {
  assert.deepEqual(skillPath(['calm']), ['firstthen', 'ask']);
  assert.equal(nextGame([], '2-3', ['routines']).game.skill, 'routine');
  assert.equal(nextGame([], '1-2', ['calm']).game.skill, 'firstthen');
});

test('/api/play returns the tested game when the AI is off', async () => {
  const res = await worker.fetch(new Request('https://vb.example/api/play', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ gameId: 'wait-bubbles', age: '2-3', talk: 'none', favorite: 'trains' }),
  }), { MOCK_AI: '1' });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.id, 'wait-bubbles');
  assert.ok(body.steps.length >= 3);
  assert.ok(SKILLS.some((s) => s.id === body.skill));
});

test('/api/play rejects unknown games', async () => {
  const res = await worker.fetch(new Request('https://vb.example/api/play', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ gameId: 'nope' }),
  }), { MOCK_AI: '1' });
  assert.equal(res.status, 400);
});
