import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(new URL('../public/index.html', import.meta.url).href);
  await page.waitForURL('http://localhost:3400/');
  await page.waitForFunction(() => document.querySelector('#sceneImage')?.naturalWidth > 0 && document.documentElement.dataset.tone === 'light');
  assert.equal(await page.locator('#startButton').isVisible(), true);
  assert.equal(await page.locator('.app-shell').evaluate(element => getComputedStyle(element).maxWidth), '1240px');
  assert.equal(await page.locator('#startButton').textContent(), 'Enable camera & mic');
  await page.screenshot({ path: fileURLToPath(new URL('../../flippy-opened-ui.png', import.meta.url)), fullPage: true });
  console.log('Opening the local HTML file reaches the running app with the styled UI and photo loaded.');
} finally { await browser.close(); }
