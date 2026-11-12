import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const origin = new URL(process.argv[2]).origin;
if (!origin.startsWith('https://') || !new URL(origin).hostname.endsWith('.trycloudflare.com')) throw new Error('Supply the generated HTTPS Cloudflare test URL');
const response = await fetch(origin);
assert.equal(response.status, 200);
assert.match(await response.text(), /Flippy/);
assert.equal((await fetch(`${origin}/lab.html`)).status, 404);
assert.equal((await fetch(`${origin}/api/lab`)).status, 404);
const session = await fetch(`${origin}/api/session`);
assert.equal((await session.json()).testing, false);
assert.match(session.headers.get('set-cookie'), /Secure/);
console.log('Public HTTPS, secure cookie, updated Flippy page and hidden lab controls: passed');
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true,
  args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
try {
  const context = await browser.newContext({ permissions: ['camera', 'microphone'] });
  const page = await context.newPage();
  await page.goto(origin);
  await page.waitForFunction(() => {
    const scene = document.querySelector('#sceneImage');
    return scene?.complete && scene.naturalWidth > 0 && document.documentElement.dataset.tone;
  });
  assert.equal(await page.locator('#sceneImage').evaluate(image => image.currentSrc.endsWith('mountain-landscape.jpg')), true);
  console.log('Public landscape photo and calibrated matte interface: passed');
  await page.locator('#startButton').click();
  await page.waitForFunction(() => document.querySelector('#notice').textContent.includes('Camera ready'), null, { timeout: 30000 });
  await page.locator('#startButton').click();
  await page.waitForFunction(() => document.body.dataset.state === 'chatting', null, { timeout: 45000 });
  assert.match(await page.locator('#partnerType').textContent(), /TEST BOT/);
  assert.equal(await page.locator('#micBadge').textContent(), 'Mic on');
  assert.equal(await page.locator('#remoteVideo').evaluate(video => video.srcObject.getAudioTracks().filter(track => track.readyState === 'live').length), 1);
  await page.waitForTimeout(12000);
  assert.equal(await page.evaluate(async () => (await import('/diagnostics.js')).report().snapshot.reactionsReceived), 0);
  console.log('Public WebSocket, camera gate, microphone capture, remote audio track and no automatic hearts: passed');
  await page.locator('#stopButton').click();
} finally { await browser.close(); }
