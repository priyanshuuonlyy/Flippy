import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createRgcServer } from '../server/index.js';

test('photo orientation, calibrated matte colors, responsive layout and accessible settings', { timeout: 90000 }, async () => {
  const origin = 'http://localhost:3197'; const app = createRgcServer({ origin, iceServers: [] });
  app.server.listen(3197, '127.0.0.1'); await once(app.server, 'listening');
  let browser;
  try {
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
    const page = await browser.newPage(); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const [name, width, height, tone, file] of [
      ['desktop', 1440, 1050, 'light', 'mountain-landscape.jpg'],
      ['tablet', 768, 1024, 'dark', 'night-portrait.jpg'],
      ['mobile', 390, 844, 'dark', 'night-portrait.jpg'],
      ['small-mobile', 320, 740, 'dark', 'night-portrait.jpg'],
      ['phone-landscape', 844, 390, 'light', 'mountain-landscape.jpg']
    ]) {
      await page.setViewportSize({ width, height }); await page.goto(origin);
      await page.waitForFunction(tone => document.documentElement.dataset.tone === tone, tone);
      assert.equal(await page.locator('#sceneImage').evaluate((image, file) => image.currentSrc.endsWith(file) && image.complete && image.naturalWidth > 0, file), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, name);
      if (tone === 'dark') assert.equal(await page.locator('#sceneImage').evaluate(image => image.naturalHeight > image.naturalWidth), true);
      assert.equal(await page.locator('#micBadge').isVisible(), true);
      const contentBox = await page.locator('.empty-content').boundingBox();
      const previewBox = await page.locator('#localCard').boundingBox();
      assert.ok(contentBox.y + contentBox.height <= previewBox.y || contentBox.x + contentBox.width <= previewBox.x, name + ' preview must not cover instructions');
      for (const selector of ['#startButton', '#nextButton', '#heartButton', '#settingsToggle']) {
        const box = await page.locator(selector).boundingBox(); assert.ok(box.height >= 44 && box.width >= 44, selector);
      }
      await page.screenshot({ path: fileURLToPath(new URL(`../../flippy-matte-${name}.png`, import.meta.url)), fullPage: true });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#settingsLink').click();
    assert.equal(await page.locator('#accessibilityPanel').evaluate(element => element.open), true);
    await page.waitForFunction(() => document.querySelector('#settingsToggle').getAttribute('aria-expanded') === 'true');
    await page.locator('#settingsToggle').click();
    assert.equal(await page.locator('#accessibilityPanel').evaluate(element => element.open), false);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
    assert.deepEqual(errors, []);
  } finally { await browser?.close(); await app.close(); }
});
