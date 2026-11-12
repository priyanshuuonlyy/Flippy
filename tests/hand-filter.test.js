import test from 'node:test';
import assert from 'node:assert/strict';
import { OneEuro, HandFilter, inferenceSize } from '../shared/hand-filter.js';
const hand = horizontal => Array.from({ length: 21 }, () => ({ x: horizontal, y: .5, z: .1 }));

test('One Euro reduces stationary jitter and resets after a dropped-frame gap', () => {
  const filter = new OneEuro(); let rawError = 0; let filteredError = 0;
  for (let index = 0; index < 80; index++) {
    const value = .5 + (index % 2 ? .02 : -.02); const result = filter.update(value, index * 66);
    if (index > 10) { rawError += Math.abs(value - .5); filteredError += Math.abs(result - .5); }
  }
  assert.ok(filteredError < rawError / 2);
  assert.equal(filter.update(.8, 10000), .8);
});
test('reordered hands retain their spatial tracks instead of blending across palms', () => {
  const filter = new HandFilter(); filter.update([hand(.2), hand(.8)], 0);
  const tracked = filter.update([hand(.79), hand(.21)], 66);
  assert.ok(tracked[0][0].x < .3); assert.ok(tracked[1][0].x > .7);
  assert.equal(tracked[0][0].z, .1);
});
test('no stale landmarks survive lost hands or invalid samples', () => {
  const filter = new HandFilter(); filter.update([hand(.2)], 0);
  assert.deepEqual(filter.update([], 100), []);
  assert.equal(filter.update([hand(.8)], 200)[0][0].x, .8);
  assert.deepEqual(filter.update([[{ x: NaN, y: 0 }]], 300), []);
});
test('portrait and landscape inference images preserve aspect ratio', () => {
  assert.deepEqual(inferenceSize(1080, 1920), { resizeWidth: 360, resizeHeight: 640, resizeQuality: 'low' });
  assert.deepEqual(inferenceSize(1920, 1080), { resizeWidth: 640, resizeHeight: 360, resizeQuality: 'low' });
  assert.equal(inferenceSize(0, 0), null);
});
