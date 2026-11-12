import test from 'node:test';
import assert from 'node:assert/strict';
import { CameraGate, frameStatistics, validSample } from '../shared/health.js';

export const sample = (frames = 1, extra = {}) => ({ permission: true, live: true, enabled: true, muted: false, lowLight: false, frames, frameAge: 50, mean: 80, variance: 50, motion: 1, ...extra });
function ready() { const gate = new CameraGate(); gate.observe(sample(1), 0); gate.observe(sample(2), 3000); return gate; }
test('requires recovery dwell and rejects camera off immediately', () => {
  const gate = new CameraGate(); gate.observe(sample(), 0); assert.equal(gate.check(0), false);
  gate.observe(sample(2), 3000); assert.equal(gate.check(3000), true);
  gate.observe(sample(3, { enabled: false }), 4000); assert.equal(gate.check(4000), false);
});

test('permission loss, ended source and source muting each revoke eligibility', () => {
  for (const change of [{ permission: false }, { live: false }, { muted: true }]) {
    const gate = ready(); gate.observe(sample(3, change), 4000); assert.equal(gate.check(4000), false);
  }
});
test('black frame grace lasts two minutes and brief good samples cannot reset it', () => {
  const gate = ready();
  for (let time = 4000; time <= 124000; time += 2000) {
    gate.observe(sample(time, time === 64000 ? {} : { mean: 0, variance: 0, motion: 0 }), time);
    assert.equal(gate.check(time), time < 124000);
  }
  gate.observe(sample(125000), 125000); assert.equal(gate.check(125000), false);
  gate.observe(sample(128000), 128000); assert.equal(gate.check(128000), true);
});
test('heartbeat expiry denies eligibility without relying on client UI', () => {
  const gate = ready(); assert.equal(gate.check(10001), false);
  gate.observe(sample(3), 11000); assert.equal(gate.check(11000), false);
});
test('new black camera cannot match, dim-room option never accepts pure black', () => {
  const gate = new CameraGate();
  for (let time = 0; time <= 10000; time += 2000) gate.observe(sample(time, { lowLight: true, mean: 0, variance: 0, motion: 0 }), time);
  assert.equal(gate.check(10000), false);
  gate.observe(sample(11000, { lowLight: true, mean: 3, variance: 1 }), 11000);
  gate.observe(sample(14000, { lowLight: true, mean: 3, variance: 1 }), 14000);
  assert.equal(gate.check(14000), true);
});
test('frozen frames and stopped frame counters are detected', () => {
  const gate = ready();
  for (let time = 4000; time <= 140000; time += 2000) gate.observe(sample(time, { motion: 0 }), time);
  assert.equal(gate.check(140000), false);
  const stalled = ready(); stalled.observe(sample(2), 4000); assert.equal(stalled.state, 'warning');
});
test('frame statistics measure luminance, variance and changes', () => {
  const previous = new Uint8ClampedArray([0, 0, 0, 255, 0, 0, 0, 255]);
  const result = frameStatistics(new Uint8ClampedArray([10, 10, 10, 255, 20, 20, 20, 255]), previous);
  for (const [key, expected] of Object.entries({ mean: 15, variance: 25, motion: 15 })) assert.ok(Math.abs(result[key] - expected) < 1e-9);
  assert.equal(validSample(sample(1, { mean: NaN })), false);
  assert.equal(validSample(sample(1, { enabled: 'true' })), false);
  assert.equal(validSample(sample(1, { frames: -1 })), false);
});
