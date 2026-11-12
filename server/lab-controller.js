import { randomBytes } from 'node:crypto';
import { chromium } from '@playwright/test';

export class LabController {
  constructor(origin) {
    this.origin = origin; this.token = randomBytes(32).toString('hex'); this.browser = null;
    this.bots = []; this.busy = false; this.events = []; this.error = null; this.stopping = false;
  }
  note(type, detail) {
    this.events.push({ at: new Date().toISOString(), type, detail });
    if (this.events.length > 100) this.events.shift();
  }
  snapshot() {
    return { testing: true, busy: this.busy, error: this.error, bots: this.bots.map(({ id, state, reactions }) => ({ id, state, reactions })), events: this.events };
  }
  async start(count) {
    if (this.busy || this.browser) throw new Error('Stop the existing bots before starting a new run');
    if (!Number.isInteger(count) || count < 1 || count > 4) throw new Error('Choose one to four bots');
    this.busy = true; this.error = null; this.stopping = false;
    try {
      const launched = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true,
        args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
      if (this.stopping) { await launched.close(); return; }
      this.browser = launched;
      for (let index = 0; index < count; index++) {
        if (this.stopping) return;
        const context = await this.browser.newContext({ permissions: ['camera', 'microphone'], extraHTTPHeaders: { 'x-flippy-bot-token': this.token } });
        const page = await context.newPage();
        const bot = { id: `Test partner ${index + 1}`, state: 'starting', reactions: 0, context, page };
        this.bots.push(bot);
        await page.goto(this.origin);
        await page.locator('#startButton').click();
        await page.waitForFunction(() => document.querySelector('#notice')?.textContent.includes('Camera ready'), null, { timeout: 25000 });
        await page.locator('#startButton').click();
        bot.state = 'searching'; this.note('bot-ready', bot.id);
      }
      this.poll();
    } catch (error) {
      this.error = error.message; this.note('error', error.message); await this.shutdown(); throw error;
    } finally { this.busy = false; }
  }
  async poll() {
    if (this.stopping || !this.browser) return;
    for (const bot of this.bots) {
      try {
        const state = await bot.page.evaluate(() => document.body.dataset.state);
        if (state !== bot.state) { bot.state = state; this.note('bot-state', `${bot.id}: ${state}`); }
        if (['preview', 'paused'].includes(state) && await bot.page.locator('#startButton').isEnabled()) await bot.page.locator('#startButton').click({ timeout: 1000 });
      } catch (error) { if (!this.stopping) { bot.state = 'error'; this.note('error', `${bot.id}: ${error.message.slice(0, 160)}`); } }
    }
    if (!this.stopping) this.timer = setTimeout(() => this.poll(), 1000);
  }
  async shutdown() {
    this.stopping = true; clearTimeout(this.timer);
    const browser = this.browser; this.browser = null;
    await browser?.close(); this.bots = []; this.note('stopped', 'All test partners stopped');
  }
  async handle(request, response) {
    response.setHeader('Content-Type', 'application/json');
    const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.socket.remoteAddress);
    if (!local || request.headers.host !== new URL(this.origin).host) { response.writeHead(403); response.end('{}'); return; }
    const url = new URL(request.url, this.origin);
    if (request.method === 'GET' && url.pathname === '/api/lab') { response.end(JSON.stringify(this.snapshot())); return; }
    if (request.method !== 'POST' || request.headers.origin !== this.origin || request.headers['x-flippy-lab'] !== '1') {
      response.writeHead(403); response.end('{}'); return;
    }
    if (this.busy) { response.writeHead(409); response.end(JSON.stringify({ error: 'A test operation is already running' })); return; }
    if (url.pathname === '/api/lab/start') {
      const count = Number(url.searchParams.get('count') || 2);
      if (!Number.isInteger(count) || count < 1 || count > 4 || this.browser) { response.writeHead(400); response.end('{}'); return; }
      this.start(count).catch(() => {}); response.writeHead(202); response.end(JSON.stringify({ accepted: true })); return;
    }
    if (url.pathname === '/api/lab/stop') {
      this.busy = true;
      try { await this.shutdown(); response.end(JSON.stringify({ stopped: true })); }
      finally { this.busy = false; }
      return;
    }
    response.writeHead(404); response.end('{}');
  }
}
