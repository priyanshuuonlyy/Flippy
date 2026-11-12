import test from 'node:test';
import assert from 'node:assert/strict';
import { HeartBalloons, REACTION_KINDS } from '../public/reactions.js';

function setup(reduced = false) {
  const operations = { strokes: 0, text: 0, dimming: 0 };
  const methods = ['setTransform', 'clearRect', 'save', 'restore', 'translate', 'rotate',
    'scale', 'beginPath', 'moveTo', 'lineTo', 'bezierCurveTo', 'quadraticCurveTo', 'arc', 'closePath'];
  const ctx = Object.fromEntries(methods.map(name => [name, () => {}]));
  ctx.stroke = () => { operations.strokes++; };
  ctx.fillText = () => { operations.text++; };
  ctx.fillRect = () => { operations.dimming++; };
  const canvas = { width: 0, height: 0,
    getContext: () => ctx, getBoundingClientRect: () => ({ width: 360, height: 300 }) };
  globalThis.ResizeObserver = class { observe() {} };
  globalThis.devicePixelRatio = 1;
  const frames = [];
  globalThis.requestAnimationFrame = callback => { frames.push(callback); return frames.length; };
  return { effect: new HeartBalloons(canvas, () => reduced), canvas, operations, frames };
}

test('all five reactions use original vector strokes, not emoji fonts or video dimming', () => {
  const { effect, operations } = setup();
  const now = performance.now();
  for (const [i, kind] of REACTION_KINDS.entries()) {
    effect.burst({ id: 'r-' + i, kind, seed: 400 + i });
  }
  effect.draw(now + 1050);
  assert.deepEqual(REACTION_KINDS, ['heart', 'laugh', 'fire', 'clap', 'sparkles']);
  assert.ok(operations.strokes > 0);
  assert.equal(operations.text, 0);
  assert.equal(operations.dimming, 0);
  assert.equal(effect.particles.length, 128);
});

test('same reaction event is drawn once; unknown kinds fall back to heart', () => {
  const { effect } = setup();
  effect.burst({ id: 'same', kind: 'heart', seed: 1 });
  effect.burst({ id: 'same', kind: 'heart', seed: 1 });
  assert.equal(effect.particles.length, 44);
  effect.burst({ id: 'unknown', kind: 'untrusted', seed: 2 });
  assert.equal(effect.particles.at(-1).kind, 'heart');
});

test('reduced motion produces a smaller and shorter effect', () => {
  const { effect } = setup(true);
  effect.burst({ id: 'reduced', kind: 'sparkles', seed: 3 });
  assert.equal(effect.particles.length, 8);
  assert.ok(effect.particles.every(particle => particle.duration === 1050 && particle.reduced));
});

test('burst volume stays bounded during rapid reactions', () => {
  const { effect } = setup();
  for (let i = 0; i < 15; i++) effect.burst({ id: String(i), kind: 'fire', seed: i });
  assert.equal(effect.particles.length, 128);
  assert.ok(effect.seen.size <= 64);
});
