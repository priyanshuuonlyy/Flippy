import test from 'node:test';
import assert from 'node:assert/strict';
import { PALETTES, contrast, composite, sceneTone } from '../shared/appearance.js';

test('primary and secondary text retain 4.5:1 contrast through matte panels over every neutral brightness', () => {
  for (const palette of Object.values(PALETTES)) for (let brightness = 0; brightness <= 255; brightness++) {
    const background = composite(palette.surface, [brightness, brightness, brightness], palette.alpha);
    for (const ink of [palette.ink, palette.secondary]) assert.ok(contrast(ink, background) >= 4.5);
  }
});

test('scene calibration selects restrained light and dark palettes and ignores empty samples', () => {
  assert.equal(sceneTone(new Uint8ClampedArray([210, 215, 220, 255, 150, 160, 170, 255])), 'light');
  assert.equal(sceneTone(new Uint8ClampedArray([25, 38, 45, 255, 0, 0, 0, 255])), 'dark');
  assert.equal(sceneTone(new Uint8ClampedArray([255, 255, 255, 0])), null);
});
