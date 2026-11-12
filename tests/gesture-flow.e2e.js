import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { chromium } from '@playwright/test';
import { createRgcServer } from '../server/index.js';

test('scripted landmarks pass through filtering into one synced heart and one call skip', { timeout: 90000 }, async () => {
  const origin = 'http://localhost:3198'; const app = createRgcServer({ origin, iceServers: [] });
  app.server.listen(3198, '127.0.0.1'); await once(app.server, 'listening'); let browser;
  try {
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true,
      args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
    const pages = [];
    for (let index = 0; index < 2; index++) {
      const context = await browser.newContext({ permissions: ['camera', 'microphone'] });
      await context.addInitScript(() => {
        window.testGesture = 'none'; window.gestureStarted = 0;
        const swipe = offset => {
          const hand = Array.from({ length: 21 }, () => ({ x: .5 + offset, y: .7 }));
          for (const [i, x, y] of [[0,.5,.85],[9,.5,.65],[5,.45,.65],[17,.59,.69],[6,.46,.5],[8,.46,.3],[10,.52,.5],[12,.52,.3],[14,.56,.58],[16,.56,.71],[18,.59,.62],[20,.59,.73]]) hand[i] = { x: x + offset, y };
          return hand;
        };
        const heart = () => [0, 1].map(side => {
          const hand = Array.from({ length: 21 }, () => ({ x: side ? .65 : .35, y: .6 }));
          hand[0] = { x: side ? .7 : .3, y: .7 }; hand[9] = { x: side ? .65 : .35, y: .5 };
          hand[5] = { x: side ? .65 : .35, y: .4 }; hand[17] = { x: side ? .72 : .28, y: .6 };
          hand[8] = { x: side ? .51 : .49, y: .4 }; hand[4] = { x: side ? .51 : .49, y: .6 };
          return hand;
        });
        window.Worker = class {
          postMessage(data) {
            if (data.type === 'init') { setTimeout(() => this.onmessage?.({ data: { type: 'ready', backend: 'SCRIPTED_TEST' } }), 0); return; }
            const width = data.bitmap.width; const height = data.bitmap.height; data.bitmap.close();
            let hands = [];
            if (window.testGesture === 'heart') hands = heart();
            else if (window.testGesture === 'pose') hands = [swipe(0)];
            else if (window.testGesture === 'swipe') hands = [swipe(Math.min(.24, Math.max(0, data.time - window.gestureStarted - 400) / 400 * .24))];
            hands = hands.map(hand => hand.map(point => ({ x: point.x / (width / height), y: point.y })));
            setTimeout(() => this.onmessage?.({ data: { type: 'landmarks', hands, width, height, time: data.time, duration: 10 } }), 0);
          }
          terminate() { this.onmessage = null; }
        };
      });
      const page = await context.newPage(); pages.push(page); await page.goto(origin);
      await page.locator('#startButton').click();
      await page.waitForFunction(() => document.querySelector('#notice').textContent.includes('Camera ready'), { timeout: 45000 });
      await page.locator('#startButton').click();
    }
    const [first, second] = pages;
    for (const page of pages) await page.waitForFunction(() => document.body.dataset.state === 'chatting');
    await first.evaluate(() => { window.testGesture = 'pose'; });
    await first.waitForTimeout(1400);
    assert.equal(await first.evaluate(async () => (await import('/diagnostics.js')).report().snapshot.gestures), 0);
    assert.equal(await second.evaluate(async () => (await import('/diagnostics.js')).report().snapshot.reactionsReceived), 0);
    await first.evaluate(() => { window.testGesture = 'heart'; });
    await second.waitForFunction(async () => (await import('/diagnostics.js')).report().snapshot.reactionsReceived === 1);
    await first.waitForTimeout(800);
    assert.equal(await second.evaluate(async () => (await import('/diagnostics.js')).report().snapshot.reactionsReceived), 1);
    await first.evaluate(() => { window.testGesture = 'none'; }); await first.waitForTimeout(2300);
    await first.evaluate(() => { window.testGesture = 'swipe'; window.gestureStarted = performance.now(); });
    await first.waitForFunction(async () => (await import('/diagnostics.js')).report().events.some(event => event.type === 'command' && event.action === 'skip'));
    await first.waitForFunction(() => document.body.dataset.state === 'searching');
    await first.waitForTimeout(2000);
    const events = await first.evaluate(async () => (await import('/diagnostics.js')).report().events);
    assert.equal(events.filter(event => event.type === 'command' && event.action === 'skip').length, 1);
    assert.equal(events.filter(event => event.type === 'gesture' && event.action === 'skip').length, 1);
    assert.equal(await first.locator('#localVideo').evaluate(video => video.srcObject.getAudioTracks()[0].enabled), true);
    for (const page of pages) await page.locator('#stopButton').click();
  } finally { await browser?.close(); await app.close(); }
});
