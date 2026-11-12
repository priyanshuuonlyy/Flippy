import test from 'node:test';
import assert from 'node:assert/strict';
import { Matchmaker, validSignal } from '../server/matchmaker.js';

const good = frames => ({ permission: true, live: true, enabled: true, muted: false, lowLight: false, frames, frameAge: 50, mean: 80, variance: 40, motion: 1 });
function fixture() {
  let time = 0; const maker = new Matchmaker(() => time); const messages = new Map();
  const attach = id => { const events = []; messages.set(id, events); return maker.attach(id, event => events.push(event)); };
  const heartbeat = (client, sample = good(time + 1)) => { if (!client.challenge) maker.challenge(client); maker.receive(client, { type: 'heartbeat', nonce: client.challenge.nonce, seq: client.lastSeq + 1, sample }); };
  const first = attach('first'); const second = attach('second');
  heartbeat(first); heartbeat(second); time = 3000; heartbeat(first); heartbeat(second);
  return { maker, first, second, messages, attach, heartbeat, time: value => { time = value; } };
}
test('server denies camera-off matchmaking even when join is forged', () => {
  const setup = fixture(); setup.maker.receive(setup.first, { type: 'join' });
  const third = setup.attach('third'); setup.maker.receive(third, { type: 'join' });
  assert.equal(third.queued, false); assert.equal(third.partner, null);
  setup.maker.receive(setup.second, { type: 'join' }); assert.equal(setup.first.partner, 'second');
});
test('heartbeat nonce, sequence and schema reject replay and malformed claims', () => {
  const setup = fixture(); setup.maker.challenge(setup.first);
  const packet = { type: 'heartbeat', nonce: setup.first.challenge.nonce, seq: 99, sample: good(5) };
  setup.maker.receive(setup.first, packet); const last = setup.first.gate.lastFrames;
  setup.maker.receive(setup.first, { ...packet, sample: good(6) }); assert.equal(setup.first.gate.lastFrames, last);
  setup.maker.challenge(setup.first); setup.maker.receive(setup.first, { ...packet, nonce: setup.first.challenge.nonce, seq: 100, sample: { ...good(8), mean: Infinity } });
  assert.equal(setup.first.gate.lastFrames, last);
});
test('reactions are small, server-generated, room scoped and rate limited', () => {
  const setup = fixture(); for (const client of [setup.first, setup.second]) setup.maker.receive(client, { type: 'join' });
  const packet = { type: 'reaction', kind: 'heart', room: setup.first.room, seed: 'attacker', count: 1000000 };
  for (let index = 0; index < 30; index++) setup.maker.receive(setup.first, packet);
  const events = setup.messages.get('second').filter(event => event.type === 'reaction');
  assert.equal(events.length, 2); assert.equal(typeof events[0].seed, 'number'); assert.equal(events[0].count, undefined);
  setup.time(6000); setup.maker.receive(setup.first, { ...packet, room: 'wrong-room' });
  assert.equal(setup.messages.get('second').filter(event => event.type === 'reaction').length, 2);
});
test('stale heartbeat ends rooms and prevents old-room signaling', () => {
  const setup = fixture(); for (const client of [setup.first, setup.second]) setup.maker.receive(client, { type: 'join' });
  const oldRoom = setup.first.room; setup.time(11000); setup.maker.tick();
  assert.equal(setup.first.partner, null); assert.equal(setup.second.partner, null);
  setup.maker.receive(setup.first, { type: 'signal', room: oldRoom, data: { description: { type: 'offer', sdp: 'fake' } } });
  assert.equal(setup.messages.get('second').filter(event => event.type === 'signal').length, 0);
});
test('skip removes old room, cooldown blocks spam, and avoids immediate re-pair', () => {
  const setup = fixture(); for (const client of [setup.first, setup.second]) setup.maker.receive(client, { type: 'join' });
  setup.maker.receive(setup.first, { type: 'skip' }); setup.maker.receive(setup.second, { type: 'join' });
  assert.equal(setup.first.partner, null); assert.equal(setup.second.partner, null);
  setup.maker.receive(setup.first, { type: 'skip' });
  assert.equal(setup.messages.get('first').at(-1).code, 'skip-rate-limit');
});

test('block disconnects pair, queues caller, and permanently prevents re-matching', () => {
  const setup = fixture();
  for (const client of [setup.first, setup.second]) setup.maker.receive(client, { type: 'join' });
  assert.equal(setup.first.partner, 'second');
  assert.equal(setup.second.partner, 'first');

  setup.maker.receive(setup.first, { type: 'block' });
  assert.equal(setup.first.partner, null);
  assert.equal(setup.second.partner, null);
  assert.ok(setup.first.blocked.has('second'));
  assert.ok(setup.second.blocked.has('first'));
  assert.equal(setup.first.queued, true);

  setup.maker.receive(setup.second, { type: 'join' });
  assert.equal(setup.first.partner, null);
  assert.equal(setup.second.partner, null);

  const third = setup.attach('third');
  setup.heartbeat(third);
  setup.time(6000);
  setup.heartbeat(setup.first);
  setup.heartbeat(setup.second);
  setup.heartbeat(third);
  setup.maker.receive(setup.first, { type: 'join' });
  setup.maker.receive(setup.second, { type: 'join' });
  setup.maker.receive(third, { type: 'join' });

  assert.equal(setup.first.partner, 'third');
  assert.equal(third.partner, 'first');
  assert.equal(setup.second.partner, null);
});
test('reconnect keeps camera violation timer but requires fresh healthy dwell', () => {
  const setup = fixture(); setup.heartbeat(setup.first, { ...good(10), mean: 0, variance: 0 });
  const gate = setup.first.gate; const badSince = gate.badSince;
  setup.maker.detach(setup.first); const client = setup.maker.attach('first', () => {}, gate);
  assert.equal(client.gate.badSince, badSince); assert.equal(client.gate.check(3000), false);
});
test('malformed and oversized signaling is rejected', () => {
  assert.equal(validSignal({ description: { type: 'rollback', sdp: 'text' } }), false);
  assert.equal(validSignal({ description: { type: 'offer', sdp: 'x'.repeat(48001) } }), false);
  assert.equal(validSignal({ candidate: { candidate: 'x', sdpMLineIndex: -1 } }), false);
  assert.equal(validSignal({ description: { type: 'offer', sdp: 'v=0' } }), true);
});

test('server ends an active black-camera room at the two-minute limit', () => {
  const setup = fixture(); for (const client of [setup.first, setup.second]) setup.maker.receive(client, { type: 'join' });
  for (let time = 4000; time <= 124000; time += 2000) {
    setup.time(time);
    setup.heartbeat(setup.first, { ...good(time), mean: 0, variance: 0, motion: 0 });
    setup.heartbeat(setup.second, good(time)); setup.maker.tick();
    assert.equal(!!setup.first.room, time < 124000);
  }
  setup.maker.receive(setup.first, { type: 'join' });
  assert.equal(setup.first.queued, false); assert.equal(setup.second.room, null);
});

test('test bots never match with each other; partners receive an honest bot label', () => {
  const setup = fixture(); setup.first.kind = 'bot'; setup.second.kind = 'bot';
  for (const client of [setup.first, setup.second]) setup.maker.receive(client, { type: 'join' });
  assert.equal(setup.first.partner, null); assert.equal(setup.second.partner, null);
  const person = setup.attach('person'); setup.heartbeat(person); setup.time(6000); setup.heartbeat(person);
  setup.maker.receive(person, { type: 'join' });
  assert.ok(person.partner); assert.equal(setup.messages.get('person').find(event => event.type === 'matched').partnerKind, 'bot');
});

test('a consumed heartbeat nonce cannot be reused with a higher sequence', () => {
  const setup = fixture(); setup.maker.challenge(setup.first);
  const nonce = setup.first.challenge.nonce;
  setup.maker.receive(setup.first, { type: 'heartbeat', nonce, seq: 20, sample: good(50) });
  setup.maker.receive(setup.first, { type: 'heartbeat', nonce, seq: 21, sample: good(51) });
  assert.equal(setup.first.gate.lastFrames, 50);
  assert.equal(setup.messages.get('first').at(-1).code, 'invalid-heartbeat');
});
