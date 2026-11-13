import { randomUUID, randomBytes, randomInt } from 'node:crypto';
import { CameraGate } from '../shared/health.js';

export class Bucket {
  constructor(capacity, interval, now = 0) { this.capacity = capacity; this.interval = interval; this.tokens = capacity; this.at = now; }
  take(now) {
    this.tokens = Math.min(this.capacity, this.tokens + Math.max(0, now - this.at) / this.interval);
    this.at = now;
    if (this.tokens < 1) return false;
    this.tokens -= 1; return true;
  }
}

export class Matchmaker {
  constructor(now = () => performance.now()) { this.now = now; this.clients = new Map(); this.queue = new Set(); }
  attach(id, send, gate = new CameraGate(), kind = 'person') {
    if (this.clients.has(id)) {
      this.detach(this.clients.get(id));
    }
    gate.eligible = false; gate.goodSince = null; gate.lastHeartbeat = -Infinity; gate.lastFrames = null;
    const client = { id, send, gate, kind, room: null, partner: null, previous: null, avoidUntil: 0, queued: false, targetRoom: null,
      challenge: null, previousChallenge: null, lastChallenge: -Infinity, lastSeq: -1,
      messages: new Bucket(80, 50, this.now()), reactions: new Bucket(2, 2500, this.now()), skips: new Bucket(1, 1600, this.now()), signals: new Bucket(80, 100, this.now()),
      blocked: new Set() };
    this.clients.set(id, client); this.challenge(client); return client;
  }
  challenge(client) {
    const now = this.now();
    if (client.challenge) client.previousChallenge = client.challenge;
    client.challenge = { nonce: randomBytes(18).toString('hex'), expires: now + 6500 };
    client.lastChallenge = now;
    client.send({ type: 'challenge', nonce: client.challenge.nonce });
  }
  receive(client, message) {
    const now = this.now();
    if (!client.messages.take(now)) return this.error(client, 'rate-limit');
    if (!message || typeof message !== 'object' || Array.isArray(message)) return this.error(client, 'invalid-message');
    if (message.type === 'heartbeat') {
      const validNonce = (client.challenge && message.nonce === client.challenge.nonce && now <= client.challenge.expires)
        || (client.previousChallenge && message.nonce === client.previousChallenge.nonce && now <= client.previousChallenge.expires);
      if (!validNonce || !Number.isSafeInteger(message.seq) || message.seq <= client.lastSeq) return this.error(client, 'invalid-heartbeat');
      if (client.challenge && message.nonce === client.challenge.nonce) {
        client.challenge = null;
      } else client.previousChallenge = null;
      client.lastSeq = message.seq;
      if (!client.gate.observe(message.sample, now)) return this.error(client, 'invalid-sample');
      const health = client.gate.status(now);
      client.send({ type: 'health', ...health });
      if (!health.eligible) this.leave(client, health.reason);
      this.match(); return;
    }
    if (message.type === 'stop') { this.leave(client, 'Chat ended'); return; }
    if (!client.gate.check(now)) { this.leave(client, 'Camera required'); return this.error(client, 'camera-required'); }
    if (message.type === 'join') {
      if (client.partner || client.queued) return;
      if (client.gate.state !== 'ready') return this.error(client, 'camera-recovering');
      client.targetRoom = typeof message.targetRoom === 'string' && /^[a-zA-Z0-9_-]{3,32}$/.test(message.targetRoom) ? message.targetRoom : null;
      client.queued = true; this.queue.add(client.id); client.send({ type: 'queued' }); this.match(); return;
    }
    if (message.type === 'skip') {
      if (!client.skips.take(now)) return this.error(client, 'skip-rate-limit');
      client.targetRoom = null;
      this.leave(client, 'Next chat');
      if (client.gate.state !== 'ready') return this.error(client, 'camera-recovering');
      client.queued = true; this.queue.add(client.id); client.send({ type: 'queued' }); this.match(); return;
    }
    if (message.type === 'block') {
      client.targetRoom = null;
      const partnerId = client.partner;
      const partner = partnerId ? this.clients.get(partnerId) : null;
      if (partnerId) {
        if (!client.blocked) client.blocked = new Set();
        client.blocked.add(partnerId);
        if (partner) {
          if (!partner.blocked) partner.blocked = new Set();
          partner.blocked.add(client.id);
        }
      }
      this.leave(client, 'Blocked');
      if (client.gate.state !== 'ready') return this.error(client, 'camera-recovering');
      client.queued = true; this.queue.add(client.id); client.send({ type: 'queued' }); this.match(); return;
    }
    const partner = this.clients.get(client.partner);
    if (!partner || !message.room || message.room !== client.room || !partner.gate.check(now)) return this.error(client, 'no-active-room');
    if (message.type === 'reaction') {
      const allowedKinds = new Set(['heart', 'laugh', 'fire', 'clap', 'sparkles']);
      const kind = allowedKinds.has(message.kind) ? message.kind : 'heart';
      if (!client.reactions.take(now)) return this.error(client, 'reaction-rate-limit');
      const event = { type: 'reaction', room: client.room, kind, id: randomUUID(), seed: randomBytes(4).readUInt32LE() };
      client.send(event); partner.send(event); return;
    }
    if (message.type === 'signal') {
      if (!validSignal(message.data) || !client.signals.take(now)) {
        console.warn(`[Matchmaker] ⚠️ INVALID SIGNAL from ${client.id.slice(0, 8)}`);
        return this.error(client, 'invalid-signal');
      }
      partner.send({ type: 'signal', room: client.room, data: message.data });
      return;
    }
    this.error(client, 'unknown-message');
  }
  error(client, code) { client.send({ type: 'error', code }); }
  leave(client, reason) {
    if (client.room || client.partner || client.queued) {
      console.log(`[Matchmaker] ⚠️ LEAVE: ${client.id.slice(0, 8)}, reason: "${reason}"`);
    }
    this.queue.delete(client.id); client.queued = false;
    const partner = this.clients.get(client.partner);
    if (partner) {
      partner.previous = client.id; partner.avoidUntil = this.now() + 15000;
      partner.partner = null; partner.room = null; partner.send({ type: 'ended', reason });
    }
    if (client.partner) { client.previous = client.partner; client.avoidUntil = this.now() + 15000; }
    const active = client.room;
    client.partner = null; client.room = null;
    if (active) client.send({ type: 'ended', reason });
  }
  match() {
    const now = this.now();
    const waiting = [...this.queue].map(id => this.clients.get(id)).filter(client => client && client.gate.check(now) && client.gate.state === 'ready');
    while (waiting.length > 1) {
      const first = waiting.shift();
      const choices = waiting.map((other, index) => ({ other, index })).filter(({ other }) =>
        !(first.kind === 'bot' && other.kind === 'bot') &&
        !(first.previous === other.id && now < first.avoidUntil) &&
        !(other.previous === first.id && now < other.avoidUntil) &&
        !(first.blocked && first.blocked.has(other.id)) &&
        !(other.blocked && other.blocked.has(first.id)) &&
        (first.targetRoom ? other.targetRoom === first.targetRoom : !other.targetRoom)
      );
      let selectedIndex = -1;
      if (choices.length) {
        selectedIndex = choices[randomInt(choices.length)].index;
      } else {
        continue;
      }
      const second = waiting.splice(selectedIndex, 1)[0];
      first.targetRoom = null;
      second.targetRoom = null;
      const room = randomUUID();
      console.log(`[Matchmaker] 🚀 MATCHED: ${first.id.slice(0, 8)} <--> ${second.id.slice(0, 8)} in room ${room.slice(0, 8)}`);
      for (const [client, partner, initiator] of [[first, second, true], [second, first, false]]) {
        this.queue.delete(client.id); client.queued = false; client.partner = partner.id; client.room = room;
        client.send({ type: 'matched', room, initiator, partnerKind: partner.kind });
      }
    }
  }
  detach(client) { this.leave(client, 'Partner disconnected'); this.clients.delete(client.id); }
  tick() {
    const now = this.now();
    for (const client of this.clients.values()) {
      if (!client.gate.check(now)) this.leave(client, client.gate.reason);
      if (now - client.lastChallenge >= 2000 || (client.challenge && now > client.challenge.expires)) this.challenge(client);
    }
    this.match();
  }
}

export function validSignal(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (data.description) return ['offer', 'answer'].includes(data.description.type) && typeof data.description.sdp === 'string'
    && data.description.sdp.length > 0 && data.description.sdp.length <= 48000 && !data.candidate;
  const candidate = data.candidate;
  return candidate && typeof candidate === 'object' && typeof candidate.candidate === 'string' && candidate.candidate.length <= 4096
    && (candidate.sdpMid == null || typeof candidate.sdpMid === 'string' && candidate.sdpMid.length <= 64)
    && (candidate.sdpMLineIndex == null || Number.isInteger(candidate.sdpMLineIndex) && candidate.sdpMLineIndex >= 0 && candidate.sdpMLineIndex <= 16);
}
