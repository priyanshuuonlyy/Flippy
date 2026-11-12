import test from 'node:test';
import assert from 'node:assert/strict';
import { acquireConversationStream, hasMicrophone } from '../public/media.js';

function fixture(includeAudio = true) {
  const camera = { readyState: 'live', enabled: true, stop() { this.readyState = 'ended'; } };
  const microphone = { readyState: 'live', enabled: true, stop() { this.readyState = 'ended'; } };
  return { camera, microphone, stream: { getAudioTracks: () => includeAudio ? [microphone] : [], getTracks: () => includeAudio ? [camera, microphone] : [camera] } };
}
test('requests microphone capture with echo cancellation and noise suppression', async () => {
  const { stream } = fixture(); let constraints;
  const result = await acquireConversationStream({ getUserMedia: async value => { constraints = value; return stream; } }, { facingMode: 'user' });
  assert.deepEqual(constraints.audio, { echoCancellation: true, noiseSuppression: true, autoGainControl: true });
  assert.equal(result, stream); assert.equal(hasMicrophone(stream), true);
});
test('permission denial is surfaced without retrying or requesting camera-only access', async () => {
  let attempts = 0;
  const error = Object.assign(new Error('Denied'), { name: 'NotAllowedError' });
  await assert.rejects(acquireConversationStream({ getUserMedia: async () => { attempts++; throw error; } }, true), { name: 'NotAllowedError' });
  assert.equal(attempts, 1);
});
test('constraint fallback still requires microphone access', async () => {
  const { stream } = fixture(); const requests = [];
  await acquireConversationStream({ getUserMedia: async constraints => {
    requests.push(constraints);
    if (requests.length === 1) throw Object.assign(new Error('Unsupported'), { name: 'OverconstrainedError' });
    return stream;
  } }, { deviceId: { exact: 'selected-camera' } });
  assert.deepEqual(requests[1], { video: { deviceId: { exact: 'selected-camera' } }, audio: true });
});
test('failed microphone acquisition never falls back to video-only capture', async () => {
  const requests = [];
  await assert.rejects(acquireConversationStream({ getUserMedia: async constraints => {
    requests.push(constraints); throw Object.assign(new Error('Busy'), { name: 'NotReadableError' });
  } }, true), { name: 'NotReadableError' });
  assert.equal(requests.length, 2); assert.ok(requests.every(constraints => !!constraints.audio));
});
test('a stream without microphone is rejected and its camera is released', async () => {
  const { stream, camera } = fixture(false);
  await assert.rejects(acquireConversationStream({ getUserMedia: async () => stream }, true), { name: 'MicrophoneUnavailableError' });
  assert.equal(camera.readyState, 'ended');
});
test('ended or disabled microphone tracks do not count as ready', () => {
  const { stream, microphone } = fixture(); microphone.enabled = false; assert.equal(hasMicrophone(stream), false);
  microphone.enabled = true; microphone.stop(); assert.equal(hasMicrophone(stream), false);
  assert.equal(hasMicrophone(null), false);
});
