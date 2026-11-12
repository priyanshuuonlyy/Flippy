import { spawn } from 'node:child_process';
import { createRgcServer } from '../server/index.js';

const port = Number(process.env.PORT || 3000);
const application = createRgcServer({ origin: 'auto' });

console.log('======================================================================');
console.log('🌐 RGC Instant Public Cloudflare Tunnel');
console.log('======================================================================\n');
console.log(`Starting local server on port ${port}...`);

application.server.listen(port, '0.0.0.0', () => {
  console.log(`Local server active at http://localhost:${port}`);
  console.log('Requesting free public HTTPS tunnel from Cloudflare Edge...\n');

  const tunnel = spawn('npx', ['--yes', 'cloudflared', 'tunnel', '--url', `http://localhost:${port}`], {
    shell: true
  });

  let urlFound = false;

  const handleOutput = data => {
    const text = data.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && !urlFound) {
      urlFound = true;
      const publicUrl = match[0];
      console.log('**********************************************************************');
      console.log('🎉 YOUR LIVE PUBLIC HTTPS WEB URL IS READY:');
      console.log(`   👉 ${publicUrl}`);
      console.log('**********************************************************************\n');
      console.log('How to test right now:');
      console.log(` 1. Open ${publicUrl} on your mobile phone or laptop.`);
      console.log(' 2. Share the exact same link with a friend or open in a second browser window.');
      console.log(' 3. Enable camera on both devices and click "Start chatting".');
      console.log(' 4. Full camera, gestures, WebRTC video, and neon hearts work live over the internet!\n');
      console.log('Press Ctrl+C to close the tunnel and stop the server.\n');
    }
  };

  tunnel.stdout.on('data', handleOutput);
  tunnel.stderr.on('data', handleOutput);

  tunnel.on('close', code => {
    console.log(`Tunnel process exited with code ${code}`);
    application.close().then(() => process.exit(0));
  });

  process.on('SIGINT', async () => {
    console.log('\nClosing tunnel and shutting down...');
    tunnel.kill();
    await application.close();
    process.exit(0);
  });
});
