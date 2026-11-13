import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ICEBREAKER_PROMPTS, getIcebreaker, rollNextIcebreaker } from '../public/icebreaker.js';
import { Sound } from '../public/sound.js';

test('icebreaker prompts are populated across all 6 languages with equal count', () => {
  const languages = ['en', 'es', 'pt', 'tr', 'fr', 'de'];
  for (const lang of languages) {
    const list = ICEBREAKER_PROMPTS[lang];
    assert.ok(Array.isArray(list), `Expected array for language ${lang}`);
    assert.equal(list.length, 15, `Expected 15 prompts for ${lang}`);
    for (const prompt of list) {
      assert.equal(typeof prompt, 'string');
      assert.ok(prompt.trim().length > 10, `Prompt too short in ${lang}: ${prompt}`);
    }
  }
});

test('getIcebreaker and rollNextIcebreaker return valid prompts and rotate cleanly', () => {
  const p1 = getIcebreaker('en');
  assert.equal(typeof p1, 'string');
  assert.ok(p1.length > 0);

  const p2 = rollNextIcebreaker('en');
  assert.equal(typeof p2, 'string');
  assert.ok(p2.length > 0);

  const pEs = getIcebreaker('es');
  assert.equal(typeof pEs, 'string');
  assert.ok(ICEBREAKER_PROMPTS.es.includes(pEs));
});

test('Sound module enables, disables, and safely handles no-op in headless environment', () => {
  Sound.setEnabled(false);
  assert.equal(Sound.isEnabled(), false);

  // Calling play functions when disabled does not throw
  assert.doesNotThrow(() => Sound.playMatch());
  assert.doesNotThrow(() => Sound.playSkip());
  assert.doesNotThrow(() => Sound.playPop());

  Sound.setEnabled(true);
  assert.equal(Sound.isEnabled(), true);
  assert.doesNotThrow(() => Sound.playMatch());
});

test('index.html contains icebreaker card, invite button, peak lounge indicator, and sound toggle', () => {
  const html = readFileSync(join(process.cwd(), 'public', 'index.html'), 'utf8');
  assert.ok(html.includes('id="icebreakerCard"'), 'Missing #icebreakerCard');
  assert.ok(html.includes('id="icebreakerText"'), 'Missing #icebreakerText');
  assert.ok(html.includes('id="icebreakerNextBtn"'), 'Missing #icebreakerNextBtn');
  assert.ok(html.includes('id="inviteFriendBtn"'), 'Missing #inviteFriendBtn');
  assert.ok(html.includes('id="inviteCopiedToast"'), 'Missing #inviteCopiedToast');
  assert.ok(html.includes('id="soundEffects"'), 'Missing #soundEffects');
  assert.ok(html.includes('class="peak-lounge-pill"'), 'Missing .peak-lounge-pill');
});
