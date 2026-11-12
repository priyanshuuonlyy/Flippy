import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { WebSocket } from 'ws';
import { createRgcServer } from '../server/index.js';

test('shared server labels authorized bots without exposing lab controls', async () => {
  const origin = 'http://localhost:3195';
  const application = createRgcServer({ origin: 'auto', iceServers: [], botToken: 'test-only-secret' });
  application.server.listen(3195, '127.0.0.1'); await once(application.server, 'listening');
  let connection;
  try {
    assert.equal((await fetch(`${origin}/lab.html`)).status, 404);
    assert.equal((await fetch(`${origin}/api/lab`)).status, 404);
    assert.equal((await fetch(`${origin}/api/lab/start?count=4`, { method: 'POST' })).status, 405);
    const session = await fetch(`${origin}/api/session`, { headers: { 'x-flippy-bot-token': 'test-only-secret' } });
    assert.equal((await session.json()).testing, false);
    const cookie = session.headers.get('set-cookie').split(';')[0];
    connection = new WebSocket('ws://localhost:3195/signal', { origin, headers: { Cookie: cookie } });
    await once(connection, 'open');
    assert.equal([...application.matchmaker.clients.values()][0].kind, 'bot');
    const publicSession = await fetch(`${origin}/api/session`, { headers: { Host: 'flippy-test.trycloudflare.com', 'x-forwarded-proto': 'https' } });
    assert.match(publicSession.headers.get('set-cookie'), /__Host-rgc=.*; Secure/);
  } finally { connection?.terminate(); await application.close(); }
});
