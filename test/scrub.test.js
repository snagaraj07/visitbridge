import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scrub } from '../src/scrub.js';

test('removes phone, email, DOB, MRN and patient name', () => {
  const input = 'Patient: Jordan Miller   DOB: 04/12/1999   MRN: 00482913\nCall 704-555-0182 or email jm@example.com';
  const { text, removed } = scrub(input);
  assert.ok(!text.includes('Jordan'));
  assert.ok(!text.includes('04/12/1999'));
  assert.ok(!text.includes('00482913'));
  assert.ok(!text.includes('704-555-0182'));
  assert.ok(!text.includes('jm@example.com'));
  assert.equal(removed, 5);
});

test('keeps medicine doses and follow-up dates', () => {
  const input = 'Amoxicillin 500 mg 3 times daily for 10 days. Follow up on 10/24/2026. Medication name: Ibuprofen';
  const { text, removed } = scrub(input);
  assert.equal(text, input);
  assert.equal(removed, 0);
});

test('removes street addresses', () => {
  const { text } = scrub('Lab is at 234 Sharon Amity Rd today');
  assert.ok(!text.includes('234 Sharon'));
});
