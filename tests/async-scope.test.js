import test from 'node:test';
import assert from 'node:assert/strict';
import { AsyncScope } from '../shared/async-scope.js';

test('current connection operations retain signaling order', async () => {
  const scope = new AsyncScope(); const events = []; let finish;
  scope.enqueue(() => new Promise(resolve => { finish = () => { events.push('offer'); resolve(); }; }));
  const second = scope.enqueue(() => events.push('candidate'));
  await Promise.resolve(); assert.deepEqual(events, []); finish(); await second;
  assert.deepEqual(events, ['offer', 'candidate']);
});

test('reset frees a new connection from a permanently pending old operation', async () => {
  const scope = new AsyncScope(); const events = [];
  scope.enqueue(() => new Promise(() => {})); await Promise.resolve();
  scope.reset(); await scope.enqueue(() => events.push('new room'));
  assert.deepEqual(events, ['new room']);
});

test('queued old messages and late failures cannot change the replacement connection', async () => {
  const scope = new AsyncScope(); const events = []; let reject;
  scope.enqueue(() => new Promise((resolve, fail) => { reject = fail; }), () => events.push('old failure'));
  const oldTail = scope.enqueue(() => events.push('stale signal'));
  await Promise.resolve(); scope.reset();
  await scope.enqueue(() => events.push('new offer'));
  reject(new Error('Old ICE operation')); await oldTail;
  assert.deepEqual(events, ['new offer']);
});

test('an active failure is reported once and later work can continue', async () => {
  const scope = new AsyncScope(); const errors = []; const events = [];
  await scope.enqueue(() => { throw new Error('Active failure'); }, error => errors.push(error.message));
  await scope.enqueue(() => events.push('retry'));
  assert.deepEqual(errors, ['Active failure']); assert.deepEqual(events, ['retry']);
});
