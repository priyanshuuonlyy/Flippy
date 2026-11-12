import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { chromium } from '@playwright/test';
import { createRgcServer } from '../server/index.js';

test('microphone permission failure, retry, visible status and release on Leave', { timeout: 60000 }, async () => {
  const origin = 'http://localhost:3196'; const application = createRgcServer({ origin, iceServers: [] });
  application.server.listen(3196, '127.0.0.1'); await once(application.server, 'listening');
  let browser;
  try {
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true,
      args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
    const context = await browser.newContext({ permissions: ['camera', 'microphone'], viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => {
      const getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      window.microphoneDenied = true; window.mediaRequests = [];
      navigator.mediaDevices.getUserMedia = async constraints => {
        window.mediaRequests.push(constraints);
        if (constraints.audio && window.microphoneDenied) throw new DOMException('Microphone denied', 'NotAllowedError');
        return getUserMedia(constraints);
      };
    });
    const page = await context.newPage(); await page.goto(origin); await page.locator('#startButton').click();
    await page.waitForFunction(() => document.querySelector('#notice').textContent.includes('microphone permission was denied'));
    assert.equal(await page.locator('#micBadge').textContent(), 'Mic off');
    assert.equal(application.matchmaker.queue.size, 0);
    assert.equal(await page.evaluate(() => window.mediaRequests.length), 1);
    await page.evaluate(() => { window.microphoneDenied = false; });
    await page.locator('#startButton').click();
    await page.waitForFunction(() => document.querySelector('#micBadge').textContent === 'Mic on');
    assert.equal(await page.locator('#micBadge').isVisible(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const tracks = await page.locator('#localVideo').evaluateHandle(video => video.srcObject.getTracks());
    assert.equal(await tracks.evaluate(items => items.filter(track => track.kind === 'audio' && track.readyState === 'live').length), 1);
    await page.locator('#stopButton').click();
    assert.equal(await tracks.evaluate(items => items.every(track => track.readyState === 'ended')), true);
    assert.equal(await page.locator('#micBadge').textContent(), 'Mic off');
    await tracks.dispose();
    await page.locator('#startButton').click();
    await page.waitForFunction(() => document.querySelector('#startButton').textContent.includes('Start chatting') && !document.querySelector('#startButton').disabled);
    await page.locator('#startButton').click();
    await page.waitForFunction(() => document.body.dataset.state === 'searching');
    await page.locator('#localVideo').evaluate(video => video.srcObject.getAudioTracks()[0].stop());
    await page.waitForFunction(() => document.body.dataset.state === 'paused');
    await page.waitForFunction(() => document.querySelector('#notice').textContent.includes('Restart camera & mic'));
    assert.equal(await page.locator('#micBadge').textContent(), 'Mic off');
    assert.equal(await page.locator('#startButton').isDisabled(), true);
    await page.waitForTimeout(600);
    assert.equal(application.matchmaker.queue.size, 0);
    await page.locator('#accessibilityPanel > summary').click();
    await page.locator('#retryButton').click();
    await page.waitForFunction(() => document.querySelector('#micBadge').textContent === 'Mic on');
    await page.locator('#stopButton').click();
  } finally { await browser?.close(); await application.close(); }
});

test('Leave cancels pending capture and late permission results cannot stop a newer preview', { timeout: 60000 }, async () => {
  const origin = 'http://localhost:3196'; const application = createRgcServer({ origin, iceServers: [] });
  application.server.listen(3196, '127.0.0.1'); await once(application.server, 'listening'); let browser;
  try {
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true,
      args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
    for (const outcome of ['resolve', 'reject']) {
      const context = await browser.newContext({ permissions: ['camera', 'microphone'] });
      await context.addInitScript(outcome => {
        const acquire = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices); let calls = 0;
        navigator.mediaDevices.getUserMedia = constraints => {
          if (++calls > 1) return acquire(constraints);
          return new Promise((resolve, reject) => {
            window.finishPendingCapture = async () => {
              if (outcome === 'reject') { reject(new DOMException('Late denial', 'NotAllowedError')); return; }
              window.discardedStream = await acquire(constraints); resolve(window.discardedStream);
            };
          });
        };
      }, outcome);
      const page = await context.newPage(); await page.goto(origin);
      await page.locator('#gesturesEnabled').evaluate(input => { input.checked = false; });
      await page.locator('#startButton').click();
      await page.waitForFunction(() => !!window.finishPendingCapture);
      assert.equal(await page.locator('#startButton').isDisabled(), true);
      await page.locator('#stopButton').click(); await page.locator('#startButton').click();
      await page.waitForFunction(() => document.querySelector('#micBadge').textContent === 'Mic on');
      await page.evaluate(() => window.finishPendingCapture()); await page.waitForTimeout(300);
      assert.equal(await page.locator('#micBadge').textContent(), 'Mic on');
      assert.equal(await page.locator('#localVideo').evaluate(video => video.srcObject.getTracks().every(track => track.readyState === 'live')), true);
      if (outcome === 'resolve') await page.waitForFunction(() => window.discardedStream.getTracks().every(track => track.readyState === 'ended'));
      await page.locator('#stopButton').click(); await context.close();
    }
  } finally { await browser?.close(); await application.close(); }
});
