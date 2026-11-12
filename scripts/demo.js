import { chromium } from '@playwright/test';
import { createRgcServer } from '../server/index.js';

const port = Number(process.env.PORT || 3000);
const origin = `http://localhost:${port}`;

console.log('======================================================');
console.log('🤖 Automated RGC Testing & Live Demo Launcher');
console.log('======================================================\n');
console.log(`Starting local signaling server at ${origin}...`);

const application = createRgcServer({ origin });
application.server.listen(port, '127.0.0.1', async () => {
  console.log(`Server listening at ${origin}`);
  console.log('Launching automated Chrome instances (Mobile UI + Desktop)...');

  let browser;
  try {
    browser = await chromium.launch({
      channel: process.env.BROWSER_CHANNEL || 'chrome',
      headless: false,
      args: [
        '--use-fake-device-for-media-stream',
        '--use-fake-ui-for-media-stream',
        '--autoplay-policy=no-user-gesture-required'
      ]
    });

    // 1. Mobile Phone Viewport (iPhone 14 / Pixel 390x844 with touch enabled)
    const mobileContext = await browser.newContext({
      permissions: ['camera', 'microphone'],
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
    });

    // 2. Desktop Viewport
    const desktopContext = await browser.newContext({
      permissions: ['camera', 'microphone'],
      viewport: { width: 920, height: 844 }
    });

    const mobilePage = await mobileContext.newPage();
    const desktopPage = await desktopContext.newPage();

    console.log('1/5 Navigating both clients to application...');
    await Promise.all([
      mobilePage.goto(origin),
      desktopPage.goto(origin)
    ]);

    console.log('2/5 Enabling camera and microphone on both windows...');
    await Promise.all([
      mobilePage.locator('#startButton').click(),
      desktopPage.locator('#startButton').click()
    ]);

    console.log('3/5 Running live camera validation checks...');
    await Promise.all([
      mobilePage.waitForFunction(() => document.querySelector('#notice').textContent.includes('Camera ready'), null, { timeout: 25000 }),
      desktopPage.waitForFunction(() => document.querySelector('#notice').textContent.includes('Camera ready'), null, { timeout: 25000 })
    ]);

    console.log('4/5 Joining matchmaking queue...');
    await Promise.all([
      mobilePage.locator('#startButton').click(),
      desktopPage.locator('#startButton').click()
    ]);

    console.log('5/5 Establishing peer-to-peer WebRTC connection...');
    await Promise.all([
      mobilePage.waitForFunction(() => document.body.dataset.state === 'chatting', null, { timeout: 30000 }),
      desktopPage.waitForFunction(() => document.body.dataset.state === 'chatting', null, { timeout: 30000 })
    ]);

    console.log('\n✨ Both clients connected successfully!');
    console.log('Triggering automated synchronized neon-heart reaction...');
    await mobilePage.waitForTimeout(1200);
    await mobilePage.locator('#heartButton').click();

    await mobilePage.waitForTimeout(2000);
    console.log('Demonstrating Picture-in-Picture layout toggle on mobile...');
    await mobilePage.locator('#pipToggle').click();

    console.log('\n======================================================');
    console.log('🎉 Automated test & pairing complete!');
    console.log('Both live browser windows are ready for your interaction:');
    console.log('  • On Mobile window: swipe the video screen or tap "Next person →"');
    console.log('  • Tap the "◫" button to toggle Split vs PiP floating preview');
    console.log('  • Tap "♡ Send some love" to fire synchronized neon hearts');
    console.log('  • Tap "End chat" to terminate');
    console.log('Close the browser or press Ctrl+C to stop.');
    console.log('======================================================\n');

    // Keep process alive until closed
    browser.on('disconnected', () => {
      console.log('Browser closed. Shutting down demo server...');
      application.close().then(() => process.exit(0));
    });

  } catch (error) {
    console.error('Error during automated demo:', error.message);
    if (browser) await browser.close();
    await application.close();
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('\nStopping demo server...');
  await application.close();
  process.exit(0);
});
