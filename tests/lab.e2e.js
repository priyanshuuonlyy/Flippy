import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createRgcServer } from '../server/index.js';
import { LabController } from '../server/lab-controller.js';

test('Test Lab controls real labeled bots in an isolated queue and exports diagnostics', { timeout: 150000 }, async () => {
  const origin = 'http://localhost:3194'; const testing = new LabController(origin);
  const application = createRgcServer({ origin, iceServers: [], testing });
  application.server.listen(3194, '127.0.0.1'); await once(application.server, 'listening');
  let browser;
  try {
    const rejected = await fetch(`${origin}/api/lab/start?count=2`, { method: 'POST', headers: { Origin: 'https://attacker.example', 'x-flippy-lab': '1' } });
    assert.equal(rejected.status, 403);
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
    const context = await browser.newContext({ permissions: ['camera', 'microphone'], viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${origin}/lab.html`); await page.locator('#startBots').click();
    await page.waitForFunction(() => document.querySelector('#labStatus').textContent.includes('2 test partners running'), null, { timeout: 60000 });
    assert.equal([...application.matchmaker.clients.values()].every(client => !client.partner), true);
    await page.screenshot({ path: fileURLToPath(new URL('../../flippy-test-lab.png', import.meta.url)), fullPage: true });
    await page.goto(origin);
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.screenshot({ path: fileURLToPath(new URL(`../../flippy-${viewport.width}.png`, import.meta.url)), fullPage: true });
    }
    await page.locator('#startButton').click();
    await page.waitForFunction(() => document.querySelector('#notice').textContent.includes('Camera ready'), null, { timeout: 25000 });
    await page.locator('#startButton').click();
    await page.waitForFunction(() => document.body.dataset.state === 'chatting', null, { timeout: 30000 });
    assert.match(await page.locator('#partnerType').textContent(), /TEST BOT/);
    await page.waitForTimeout(12000);
    assert.equal(await page.evaluate(async () => (await import('/diagnostics.js')).report().snapshot.reactionsReceived), 0);
    assert.equal(testing.bots.every(bot => bot.reactions === 0), true);
    await page.locator('#heartButton').click();
    await page.waitForFunction(async () => (await import('/diagnostics.js')).report().snapshot.reactionsReceived >= 1);
    await page.locator('#nextButton').click();
    await page.waitForFunction(() => document.body.dataset.state === 'chatting', null, { timeout: 30000 });
    await page.locator('#labTools').evaluate(element => { element.open = true; });
    const downloadPromise = page.waitForEvent('download'); await page.locator('#exportReport').click();
    assert.equal((await downloadPromise).suggestedFilename(), 'flippy-session-report.json');
    await page.locator('#stopButton').click(); await page.goto(`${origin}/lab.html`);
    await page.locator('#stopBots').click();
    await page.waitForFunction(() => document.querySelector('#labStatus').textContent.includes('No test partners running'));
    assert.equal(testing.bots.length, 0); assert.deepEqual(errors, []);
  } finally { await browser?.close(); await testing.shutdown(); await application.close(); }
});
