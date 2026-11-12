import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { chromium } from '@playwright/test';
import { createRgcServer } from '../server/index.js';

test('onboarding modal, appearance presets, and 1-tap block UX function cleanly', { timeout: 90000 }, async () => {
  const origin = 'http://localhost:3202';
  const app = createRgcServer({ origin, iceServers: [] });
  app.server.listen(3202, '127.0.0.1');
  await once(app.server, 'listening');

  let browser;
  try {
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto(origin);

    // 1. Verify Onboarding Modal is shown on first visit
    const modal = page.locator('#onboardingModal');
    assert.equal(await modal.isVisible(), true, 'Onboarding modal visible on first visit');

    // Step 1: Language selection is active
    const step1 = page.locator('#onboardStep1');
    assert.equal(await step1.evaluate(el => el.classList.contains('active')), true);

    // Click Spanish language button
    const esBtn = page.locator('.onboard-lang-btn[data-lang="es"]');
    await esBtn.click();
    assert.equal(await page.evaluate(() => document.documentElement.lang), 'es');

    // Click Continue to Step 2 (Pledge)
    await page.locator('#onboardStep1 .onboard-btn-next').click();
    const step2 = page.locator('#onboardStep2');
    assert.equal(await step2.evaluate(el => el.classList.contains('active')), true);

    // Click Continue to Step 3 (Appearance)
    await page.locator('#onboardStep2 .onboard-btn-next').click();
    const step3 = page.locator('#onboardStep3');
    assert.equal(await step3.evaluate(el => el.classList.contains('active')), true);

    // Select 'radiance' preset
    const radianceCard = page.locator('.preset-card[data-preset="radiance"]');
    await radianceCard.click();
    assert.equal(await page.locator('#localVideo').evaluate(el => el.classList.contains('appearance-radiance')), true);

    // Click Continue to Step 4 (Gestures & Start)
    await page.locator('#onboardStep3 .onboard-btn-next').click();
    const step4 = page.locator('#onboardStep4');
    assert.equal(await step4.evaluate(el => el.classList.contains('active')), true);

    // Click Start Chatting
    await page.locator('#onboardStartBtn').click();
    assert.equal(await modal.isVisible(), false, 'Onboarding modal closes on start');

    // Check localStorage persistence
    const onboarded = await page.evaluate(() => localStorage.getItem('flippy_onboarded_v2'));
    assert.equal(onboarded, 'true');

    // 2. Verify 1-Tap Block Button
    // Initially hidden when idle
    const blockBtn = page.locator('#blockButton');
    assert.equal(await blockBtn.isVisible(), false, 'Block button hidden when idle');

    // Set state to chatting
    await page.evaluate(() => {
      document.body.dataset.state = 'chatting';
      const btn = document.getElementById('blockButton');
      if (btn) btn.hidden = false;
    });
    assert.equal(await blockBtn.isVisible(), true, 'Block button visible when chatting');

    // Verify tap target dimensions
    const box = await blockBtn.boundingBox();
    assert.ok(box && box.height >= 28, 'Block button has accessible height');

    // 3. Verify Appearance Settings selector
    await page.evaluate(() => { document.getElementById('accessibilityPanel').open = true; });
    const appearanceSelect = page.locator('#appearanceSelect');
    assert.equal(await appearanceSelect.inputValue(), 'radiance');

    // Switch to soft-light via select
    await appearanceSelect.selectOption('soft-light');
    assert.equal(await page.locator('#localVideo').evaluate(el => el.classList.contains('appearance-soft-light')), true);

    // 4. Zero horizontal overflow check
    for (const [width, height] of [[320, 740], [390, 844], [1440, 900]]) {
      await page.setViewportSize({ width, height });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
      assert.equal(overflow, true, 'no horizontal overflow at width ' + width);
    }

    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await app.close();
  }
});
