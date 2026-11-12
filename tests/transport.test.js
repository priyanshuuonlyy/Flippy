import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { WebSocket } from 'ws';
import { createRgcServer } from '../server/index.js';

test('HTTP and WebSocket enforce origin, cookies, bounds and reject binary messages', async () => {
  const origin = 'http://localhost:3191';
  const application = createRgcServer({ origin });
  application.server.listen(3191, '127.0.0.1'); await once(application.server, 'listening');
  try {
    const page = await fetch(origin); assert.equal(page.status, 200); assert.match(await page.text(), /Random Gesture Chats/);
    assert.equal((await fetch(`${origin}/lab.html`)).status, 404);
    assert.equal((await fetch(`${origin}/api/lab`)).status, 404);
    assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    assert.equal((await fetch(`${origin}/server/index.js`)).status, 404);
    assert.equal((await fetch(`${origin}/api/session`, { headers: { Origin: 'https://attacker.example' } })).status, 403);
    const response = await fetch(`${origin}/api/session`); const cookie = response.headers.get('set-cookie').split(';')[0];
    assert.match(response.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
    const denied = new WebSocket('ws://localhost:3191/signal', { origin: 'https://attacker.example', headers: { Cookie: cookie } });
    const denial = await new Promise(resolve => denied.on('error', resolve)); assert.match(denial.message, /403/);
    const connection = new WebSocket('ws://localhost:3191/signal', { origin, headers: { Cookie: cookie } });
    const challengePromise = once(connection, 'message'); await once(connection, 'open');
    const [bytes] = await challengePromise; assert.equal(JSON.parse(bytes).type, 'challenge');
    const duplicate = new WebSocket('ws://localhost:3191/signal', { origin, headers: { Cookie: cookie } });
    assert.match((await new Promise(resolve => duplicate.on('error', resolve))).message, /403/);
    const failure = once(connection, 'message'); connection.send(JSON.stringify({ type: 'join' }));
    assert.equal(JSON.parse((await failure)[0]).code, 'camera-required');
    const closed = once(connection, 'close');
    connection.send(Buffer.from('binary')); connection.send(Buffer.from('binary')); connection.send(Buffer.from('binary'));
    assert.equal((await closed)[0], 1008);
  } finally { await application.close(); }
});
