import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { chromium } from '@playwright/test';
import { createRgcServer } from '../server/index.js';

test('native reaction controls fit existing Flippy viewport and media layout', { timeout: 90000 }, async () => {
  const origin = 'http://localhost:3201';
  const app = createRgcServer({ origin, iceServers: [] });
  app.server.listen(3201, '127.0.0.1'); await once(app.server, 'listening');
  let browser;
  try {
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const [width, height] of [[320, 740], [390, 844], [844, 390], [1440, 900]]) {
      await page.setViewportSize({ width, height });
      await page.goto(origin);
      await page.evaluate(() => { document.body.dataset.state = 'chatting'; });
      assert.equal(await page.locator('#remoteVideo').evaluate(v => getComputedStyle(v).objectFit), 'contain');
      assert.equal(await page.locator('#localVideo').evaluate(v => getComputedStyle(v).objectFit), 'contain');
      assert.equal(await page.locator('#reactionTray').getAttribute('aria-label'), 'Reactions');
      assert.equal(await page.locator('.reaction-emoji-btn').count(), 5);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'horizontal overflow at ' + width);
      const tray = await page.locator('#reactionTray').boundingBox();
      assert.ok(tray && tray.x >= -1 && tray.x + tray.width <= width + 1, 'reaction tray clipped at ' + width);
      for (const button of await page.locator('.reaction-emoji-btn').all()) {
        assert.equal((await button.textContent()).trim(), '', 'no emoji font rendering');
        assert.equal(await button.locator('svg').count(), 1);
        assert.ok((await button.boundingBox()).width >= 44, 'minimum tap target width');
        assert.ok((await button.boundingBox()).height >= 44, 'minimum tap target height');
      }
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await page.locator('.reaction-emoji-btn').first().evaluate(el => getComputedStyle(el).transitionDuration), '0s');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
    }
    assert.deepEqual(errors, []);
  } finally { await browser?.close(); await app.close(); }
});
