import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { chromium } from '@playwright/test';
import { createRgcServer } from '../server/index.js';

test('reconnect escapes a pending old ICE operation and rapid Next cannot strand the room', { timeout: 120000 }, async () => {
  const origin = 'http://localhost:3199'; const app = createRgcServer({ origin, iceServers: [] });
  const connections = []; app.server.on('upgrade', (request, socket) => connections.push(socket));
  app.server.listen(3199, '127.0.0.1'); await once(app.server, 'listening'); let browser;
  try {
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true,
      args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
    const pages = [];
    for (let index = 0; index < 2; index++) {
      const context = await browser.newContext({ permissions: ['camera', 'microphone'] });
      await context.addInitScript(() => {
        const add = RTCPeerConnection.prototype.addIceCandidate;
        RTCPeerConnection.prototype.addIceCandidate = function(candidate) {
          if (window.holdNextCandidate) {
            window.holdNextCandidate = false; window.candidateHeld = true;
            return new Promise((resolve, reject) => { window.rejectOldCandidate = reject; });
          }
          return add.call(this, candidate);
        };
      });
      const page = await context.newPage(); pages.push(page); await page.goto(origin);
      await page.locator('#gesturesEnabled').evaluate(input => { input.checked = false; });
      await page.locator('#startButton').click();
      await page.waitForFunction(() => document.querySelector('#notice').textContent.includes('Camera ready'));
      await page.locator('#startButton').click();
    }
    const [first, second] = pages;
    for (const page of pages) await page.waitForFunction(() => document.body.dataset.state === 'chatting');
    const original = [...app.matchmaker.clients.values()][0]; const oldRoom = original.room;
    await first.evaluate(() => { window.holdNextCandidate = true; });
    original.send({ type: 'signal', room: oldRoom, data: { candidate: { candidate: 'candidate:1 1 udp 2122260223 127.0.0.1 9 typ host', sdpMid: '0', sdpMLineIndex: 0 } } });
    await first.waitForFunction(() => window.candidateHeld);
    connections[0].destroy();
    await first.waitForFunction(() => document.body.dataset.state === 'reconnecting');
    for (const page of pages) await page.waitForFunction(() => document.body.dataset.state === 'chatting', null, { timeout: 30000 });
    assert.notEqual([...app.matchmaker.clients.values()][0].room, oldRoom);
    await first.evaluate(() => window.rejectOldCandidate(new Error('Old connection finished late')));
    await first.waitForTimeout(400);
    assert.equal(await first.evaluate(() => document.body.dataset.state), 'chatting');
    await first.locator('#nextButton').evaluate(button => { button.click(); button.click(); button.click(); });
    await first.waitForTimeout(400);
    const commands = await first.evaluate(async () => (await import('/diagnostics.js')).report().events.filter(event => event.type === 'command' && event.action === 'skip'));
    assert.equal(commands.length, 1);
    for (const page of pages) await page.waitForFunction(() => document.body.dataset.state === 'chatting', null, { timeout: 25000 });
    assert.equal(await first.locator('#localVideo').evaluate(video => video.srcObject.getAudioTracks()[0].enabled), true);
    for (const page of pages) await page.locator('#stopButton').click();
  } finally { await browser?.close(); await app.close(); }
});
