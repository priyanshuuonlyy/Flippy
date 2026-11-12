import test from 'node:test';
import assert from 'node:assert/strict';
import { CameraSampler } from '../public/camera.js';

function fixture(callbacks = true) {
  let time = 0; let frame;
  const video = { readyState: 2, currentTime: 0 };
  if (callbacks) {
    video.requestVideoFrameCallback = callback => { frame = callback; return 1; };
    video.cancelVideoFrameCallback = () => {};
  }
  const pixels = new Uint8ClampedArray(64 * 48 * 4).fill(80);
  const sampler = new CameraSampler(video, { now: () => time, createCanvas: () => ({
    getContext: () => ({ drawImage() {}, getImageData: () => ({ data: pixels }) })
  }) });
  const stream = { getVideoTracks: () => [{ readyState: 'live', enabled: true, muted: false }] };
  sampler.attach(stream);
  return { sampler, video, stream, at: value => { time = value; }, frame: () => frame() };
}

test('sampling the same displayed frame never fabricates camera progress', () => {
  const f = fixture();
  f.frame(); f.sampler.sample(); f.at(2500); f.sampler.sample();
  const health = f.sampler.telemetry(false);
  assert.equal(health.frames, 1); assert.equal(health.frameAge, 2500);
});

test('fallback frame accounting requires video time to actually advance', () => {
  const f = fixture(false); f.sampler.sample(); f.at(500); f.sampler.sample();
  assert.equal(f.sampler.telemetry(false).frames, 1);
  assert.equal(f.sampler.telemetry(false).frameAge, 500);
  f.video.currentTime = .2; f.at(1000); f.sampler.sample();
  assert.equal(f.sampler.telemetry(false).frames, 2); assert.equal(f.sampler.telemetry(false).frameAge, 0);
});

test('late callbacks and old luminance cannot revive a detached camera', () => {
  const f = fixture(); f.frame(); f.sampler.sample(); f.sampler.detach(); f.frame();
  assert.equal(f.sampler.telemetry(false).frames, 1); assert.equal(f.sampler.telemetry(false).permission, false);
  f.sampler.attach(f.stream);
  assert.equal(f.sampler.telemetry(false).mean, 0); assert.equal(f.sampler.telemetry(false).frameAge, 3600000);
});
