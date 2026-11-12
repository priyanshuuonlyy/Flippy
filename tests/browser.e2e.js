import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createRgcServer } from '../server/index.js';

test('desktop/mobile UI, real WebRTC, heart sync, camera-off gate, recovery and cleanup', { timeout: 120000 }, async () => {
  const origin = 'http://localhost:3192'; const application = createRgcServer({ origin, iceServers: [] });
  const upgraded = [];
  const trace = [];
  let tracing = false;
  const receive = application.matchmaker.receive.bind(application.matchmaker);
  application.matchmaker.receive = (client, message) => {
    receive(client, message);
    if (tracing && ['heartbeat', 'join', 'stop', 'signal'].includes(message.type)) {
      trace.push({ at: Math.round(performance.now()), id: client.id.slice(0, 8), type: message.type,
        signal: message.data?.description?.type ?? (message.data?.candidate ? 'candidate' : undefined),
        room: client.room?.slice(0, 8), queued: client.queued, state: client.gate.state, eligible: client.gate.eligible,
        reason: client.gate.reason, frames: message.sample?.frames, age: message.sample?.frameAge,
        avoidMs: Math.round(client.avoidUntil - performance.now()) });
    }
  };
  application.server.on('upgrade', (request, connection) => upgraded.push(connection));
  application.server.listen(3192, '127.0.0.1'); await once(application.server, 'listening');
  let browser;
  const errors = [];
  try {
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true,
      args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
    const firstContext = await browser.newContext({ permissions: ['camera', 'microphone'], viewport: { width: 1440, height: 1080 } });
    const secondContext = await browser.newContext({ permissions: ['camera', 'microphone'], viewport: { width: 1280, height: 900 } });
    const first = await firstContext.newPage(); const second = await secondContext.newPage();
    for (const page of [first, second]) {
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    }
    await first.goto(origin);
    await first.screenshot({ path: fileURLToPath(new URL('../../rgc-preview.png', import.meta.url)), fullPage: true });
    await first.setViewportSize({ width: 390, height: 844 });
    assert.equal(await first.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await first.screenshot({ path: fileURLToPath(new URL('../../rgc-mobile-preview.png', import.meta.url)), fullPage: true });
    await first.setViewportSize({ width: 1440, height: 1080 });
    await second.goto(origin);
    for (const page of [first, second]) {
      await page.locator('#startButton').click();
      await page.waitForFunction(() => document.querySelector('#notice').textContent.includes('Camera ready'), null, { timeout: 20000 });
      await page.locator('#startButton').click();
    }
    for (const page of [first, second]) await page.waitForFunction(() => document.body.dataset.state === 'chatting', null, { timeout: 30000 });
    assert.equal(await first.locator('#remoteVideo').evaluate(video => video.srcObject.getVideoTracks().length), 1);
    assert.equal(await first.locator('#remoteVideo').evaluate(video => video.srcObject.getAudioTracks().filter(track => track.readyState === 'live').length), 1);
    assert.equal(await first.locator('#micBadge').textContent(), 'Mic on');
    await first.waitForFunction(() => document.querySelector('#gestureStatus').textContent.includes('ready'), null, { timeout: 30000 });
    await first.locator('#heartButton').click();
    await second.waitForFunction(() => {
      const canvas = document.querySelector('#hearts'); const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      return pixels.some((value, index) => index % 4 === 0 && value > 80 && pixels[index + 3] > 0);
    });
    await second.waitForTimeout(1200);
    await second.screenshot({ path: fileURLToPath(new URL('../../rgc-reaction-preview.png', import.meta.url)), fullPage: true });
    await first.locator('#localVideo').evaluate(video => { video.srcObject.getVideoTracks()[0].enabled = false; });
    await first.waitForFunction(() => document.body.dataset.state === 'paused');
    await second.waitForFunction(() => document.body.dataset.state === 'searching');
    assert.equal([...application.matchmaker.clients.values()].every(client => !client.room), true);
    await first.locator('#localVideo').evaluate(video => { video.srcObject.getVideoTracks()[0].enabled = true; });
    await first.waitForFunction(() => document.querySelector('#notice').textContent.includes('Camera ready'), null, { timeout: 20000 });
    await first.locator('#startButton').click();
    await first.waitForFunction(() => document.body.dataset.state === 'chatting', null, { timeout: 30000 });
    const oldRoom = [...application.matchmaker.clients.values()][0].room;
    tracing = true;
    upgraded[0].destroy();
    await first.waitForFunction(() => document.body.dataset.state === 'reconnecting');
    try { await first.waitForFunction(() => document.body.dataset.state === 'chatting', null, { timeout: 30000 }); }
    catch (error) {
      console.log('Reconnect server trace:', JSON.stringify(trace));
      for (const page of [first, second]) console.log(JSON.stringify(await page.evaluate(async () => ({ notice: document.querySelector('#notice').textContent, diagnostics: (await import('/diagnostics.js')).report() }))));
      throw error;
    }
    assert.notEqual([...application.matchmaker.clients.values()][0].room, oldRoom);
    await first.locator('#nextButton').click();
    await first.waitForFunction(() => document.body.dataset.state === 'searching');
    assert.equal(await first.locator('#localVideo').evaluate(video => video.srcObject.getAudioTracks()[0].enabled), true);
    await first.locator('#stopButton').click();
    assert.equal(await first.locator('#localVideo').evaluate(video => video.srcObject), null);
    await second.locator('#stopButton').click();
    assert.equal(application.matchmaker.queue.size, 0);
    assert.deepEqual(errors, []);
  } finally { await browser?.close(); await application.close(); }
});

test('permission denial stays out of matching, with an accessible retry', { timeout: 30000 }, async () => {
  const origin = 'http://localhost:3193'; const application = createRgcServer({ origin });
  application.server.listen(3193, '127.0.0.1'); await once(application.server, 'listening');
  let browser;
  try {
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true, args: ['--use-fake-device-for-media-stream'] });
    const context = await browser.newContext();
    await context.addInitScript(() => { navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('Denied', 'NotAllowedError'); }; });
    const page = await context.newPage(); await page.goto(origin); await page.locator('#startButton').click();
    await page.waitForFunction(() => document.querySelector('#notice').textContent.includes('permission was denied'));
    assert.equal(await page.locator('#nextButton').isDisabled(), true);
    assert.equal(await page.locator('#startButton').isEnabled(), true);
    assert.equal(application.matchmaker.queue.size, 0);
  } finally { await browser?.close(); await application.close(); }
});
