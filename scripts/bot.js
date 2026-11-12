import { chromium } from '@playwright/test';

// Configuration from CLI flags or environment
const args = process.argv.slice(2);
function getArg(flag, fallback) {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : fallback;
}

const targetUrl = getArg('--url', process.env.TARGET_URL || 'http://localhost:3000');
const botCount = Math.max(1, Math.min(10, Number(getArg('--count', process.env.BOT_COUNT || 1))));
const headless = getArg('--headless', 'true') !== 'false';

console.log('======================================================================');
console.log('🤖 RGC Automated Virtual Test User (Bot)');
console.log('======================================================================');
console.log(`Target URL:   ${targetUrl}`);
console.log(`Active Bots:  ${botCount}`);
console.log(`Headless:     ${headless}`);
console.log('----------------------------------------------------------------------\n');

async function createBot(browser, botId) {
  const prefix = `[Bot #${botId}]`;
  const context = await browser.newContext({
    permissions: ['camera', 'microphone'],
    viewport: { width: 480, height: 640 },
    userAgent: `RGC-TestBot/${botId} (Mozilla/5.0 Chrome/Automated)`
  });

  const page = await context.newPage();
  let active = true;

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`${prefix} [Browser Error] ${msg.text()}`);
    }
  });

  console.log(`${prefix} Navigating to ${targetUrl}...`);
  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch (err) {
    console.error(`${prefix} Failed to load page:`, err.message);
    await context.close();
    return;
  }

  // 1. Enable Camera
  console.log(`${prefix} Enabling simulated camera...`);
  await page.locator('#startButton').click();

  // 2. Wait for camera check to pass
  console.log(`${prefix} Waiting for camera health readiness check (3s dwell)...`);
  try {
    await page.waitForFunction(
      () => document.querySelector('#notice')?.textContent.includes('Camera ready') || document.body.dataset.state === 'searching',
      null,
      { timeout: 25000 }
    );
  } catch {
    console.log(`${prefix} Notice check timed out, attempting to proceed...`);
  }

  // 3. Join Matchmaking
  console.log(`${prefix} Clicking "Start chatting" to enter matchmaking queue...`);
  try {
    const currentState = await page.evaluate(() => document.body.dataset.state);
    if (currentState !== 'searching' && currentState !== 'chatting') {
      await page.locator('#startButton').click();
    }
  } catch {}

  console.log(`${prefix} ✅ Bot is now active in matchmaking queue waiting for connections!`);

  let lastState = '';

  const interval = setInterval(async () => {
    if (!active || page.isClosed()) {
      clearInterval(interval);
      return;
    }
    try {
      const state = await page.evaluate(() => ({
        state: document.body.dataset.state,
        notice: document.querySelector('#notice')?.textContent || '',
        wantsChat: !document.querySelector('#startButton')?.textContent.includes('Start')
      }));

      if (state.state !== lastState) {
        lastState = state.state;
        if (state.state === 'chatting') {
          console.log(`\n🎉 ${prefix} CONNECTED TO REAL USER! Real-time WebRTC video stream active!`);
        } else if (state.state === 'searching') {
          console.log(`${prefix} In matchmaking queue (Waiting for someone to connect...)`);
        } else if (state.state === 'connecting') {
          console.log(`${prefix} Handshaking WebRTC connection with incoming partner...`);
        } else if (state.state === 'paused' || state.state === 'preview') {
          console.log(`${prefix} Session ended. Re-entering matchmaking queue...`);
          await page.locator('#startButton').click().catch(() => {});
        }
      }

    } catch {
      // Ignore transient evaluate errors during unload/nav
    }
  }, 2000);

  return {
    context,
    close: async () => {
      active = false;
      clearInterval(interval);
      await context.close().catch(() => {});
    }
  };
}

async function main() {
  console.log('Launching Chromium with fake media device streaming...');
  const browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL || 'chrome',
    headless,
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const bots = [];
  for (let i = 1; i <= botCount; i++) {
    const bot = await createBot(browser, i);
    if (bot) bots.push(bot);
  }

  console.log('\n======================================================================');
  console.log(`🚀 ${bots.length} VIRTUAL TEST USER(S) RUNNING IN BACKGROUND!`);
  console.log('======================================================================');
  console.log('How to test with this bot right now:');
  console.log(' 1. Open the website on your mobile phone or laptop browser.');
  console.log(' 2. Click "Enable camera", then click "Start chatting".');
  console.log(' 3. You will INSTANTLY connect with this virtual test user!');
  console.log(' 4. You will see its live test video stream, hear its audio test tone,');
  console.log('    without any automatic heart reactions.');
  console.log(' 5. Swipe or click "Next person →" anytime to test skipping and re-pairing.');
  console.log('\nPress Ctrl+C to stop all virtual users.\n');

  process.on('SIGINT', async () => {
    console.log('\nStopping virtual users and closing browser...');
    await Promise.all(bots.map(b => b.close()));
    await browser.close().catch(() => {});
    process.exit(0);
  });
}

main().catch(err => {
  console.error('Fatal error in bot runner:', err);
  process.exit(1);
});
