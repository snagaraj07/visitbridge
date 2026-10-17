import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addMissingSupports } from '../src/ai.js';

const base = () => [
  { text: 'I go to the clinic.', picture: 'clinic' },
  { text: 'The dentist cleans my teeth.', picture: 'tooth' },
  { text: 'It is done.', picture: 'home' },
];

test('adds comfort item and worried page early in the story', () => {
  const pages = addMissingSupports(base(), 'blue blanket');
  assert.equal(pages[1].text, 'I can bring my blue blanket with me.');
  assert.equal(pages[2].picture, 'feelings');
  assert.equal(pages[3].picture, 'tooth');
  assert.equal(pages.at(-1).picture, 'home');
  assert.equal(pages.length, 5);
});

test('leaves the story alone when supports are already there', () => {
  const pages = [
    { text: 'I hold my blue blanket.', picture: 'comfort' },
    { text: 'I feel worried and that is OK.', picture: 'feelings' },
    { text: 'Then I play with dinosaurs.', picture: 'done' },
  ];
  assert.equal(addMissingSupports(pages, 'Blue Blanket', 'en', 'dinosaurs').length, 3);
});

test('adds an ending when the story stops in the middle', () => {
  const pages = addMissingSupports(base().slice(0, 2), '', 'en', 'dinosaurs');
  assert.equal(pages.at(-2).picture, 'done');
  assert.equal(pages.at(-1).text, 'Now it is time for dinosaurs.');
});

test('counts "lawn mower toys" as mentioning "lawn mowers"', () => {
  const pages = [...base(), { text: 'I play with my lawn mower toys.', picture: 'play' }];
  addMissingSupports(pages, '', 'en', 'lawn mowers');
  assert.equal(pages.filter((p) => p.picture === 'favorite').length, 0);
});

test('daily routines end with "All done", not "The visit is over"', () => {
  const pages = addMissingSupports(base().slice(0, 2), '', 'en', '', { kind: 'routine' });
  assert.equal(pages.at(-1).text, 'All done. I did it.');
});

test('uses the model translation for other languages', () => {
  const translated = {
    comfort: () => ['मैं अपना कंबल साथ ला सकता हूँ।', 'अपना कंबल मत भूलना!'],
    feelings: ['चिंता होना ठीक है।', 'चिंता होना ठीक है, NAME।'],
    done: () => ['हो गया।', 'हो गया!'],
    favorite: () => ['अब खेलने का समय है।', 'अब खेलने का समय!'],
  };
  const pages = addMissingSupports(base(), 'blanket', 'hi', '', { translated });
  assert.match(pages[1].text, /कंबल/);
  assert.equal(pages[2].picture, 'feelings');
});

test('trusts the comfort picture when the item name is translated', () => {
  const pages = [{ text: 'Je tiens ma couverture.', picture: 'comfort' }, { text: 'Fini !', picture: 'done' }];
  addMissingSupports(pages, 'blanket', 'fr', '', { translated: null });
  assert.equal(pages.filter((p) => p.picture === 'comfort').length, 1);
});

test('uses Spanish text for Spanish stories', () => {
  const pages = addMissingSupports(base(), 'osito', 'es');
  assert.match(pages[1].text, /osito/);
  assert.match(pages[2].text, /nervios/);
});
