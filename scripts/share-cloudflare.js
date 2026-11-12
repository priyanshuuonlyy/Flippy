import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import { createRgcServer } from '../server/index.js';

const port = Number(process.env.SHARE_PORT || 3400);
const localOrigin = `http://localhost:${port}`;
const binaryArgument = process.argv.indexOf('--cloudflared');
const binary = binaryArgument >= 0 ? path.resolve(process.argv[binaryArgument + 1]) : process.env.CLOUDFLARED_PATH || 'cloudflared';

// Real human matchmaking only - no bots
const application = createRgcServer({
  origin: 'auto',
  ...(process.env.ICE_SERVERS_JSON ? { iceServers: JSON.parse(process.env.ICE_SERVERS_JSON) } : {})
});
application.server.listen(port, '127.0.0.1');
await once(application.server, 'listening');
console.log(`Flippy share server: ${localOrigin}`);

let tunnel = null;
let closing = false;
let publicUrl = null;
let outputTail = '';
let retryCount = 0;
const MAX_RETRIES = 12;

function output(chunk) {
  const text = chunk.toString();
  process.stdout.write(text);
  outputTail = (outputTail + text).slice(-16000);
  const match = outputTail.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if (!publicUrl && match) {
    publicUrl = match[0];
    retryCount = 0;
    console.log(`\nFLIPPY_PUBLIC_URL=${publicUrl}\nNo bots active. Real users only.\n`);
  }
}

function scheduleRetry() {
  if (closing) return;
  if (retryCount >= MAX_RETRIES) {
    console.error('Cloudflare tunnel could not be established after multiple attempts.');
    close(1);
    return;
  }
  retryCount++;
  const delay = Math.min(25000, 5000 * Math.min(retryCount, 4));
  console.log(`Tunnel disconnected or rate-limited. Retrying in ${delay / 1000}s (attempt ${retryCount}/${MAX_RETRIES})...`);
  setTimeout(startTunnel, delay);
}

function startTunnel() {
  if (closing) return;
  tunnel = spawn(binary, ['tunnel', '--no-autoupdate', '--protocol', 'http2', '--url', localOrigin], {
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  tunnel.stdout.on('data', output);
  tunnel.stderr.on('data', output);
  tunnel.on('error', error => {
    console.error(`Tunnel error: ${error.message}`);
    scheduleRetry();
  });
  tunnel.on('exit', () => {
    if (closing) return;
    if (publicUrl) {
      console.warn('Tunnel dropped. Re-establishing connection...');
      publicUrl = null;
    }
    scheduleRetry();
  });
}

async function close(code = 0) {
  if (closing) return;
  closing = true;
  try { tunnel?.kill(); } catch {}
  await application.close();
  process.exitCode = code;
}

process.on('SIGINT', () => close());
process.on('SIGTERM', () => close());

startTunnel();
