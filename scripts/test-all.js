import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';

const root = fileURLToPath(new URL('../', import.meta.url));

console.log('🚀 Running Full Automated Test Suite for RGC...\n');

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`Process exited with code ${code}`));
    });
  });
}

try {
  const files = readdirSync(new URL('../tests/', import.meta.url));
  console.log('--- 1. Running Unit & State Machine Tests ---');
  await run(process.execPath, ['--test', ...files.filter(name => name.endsWith('.test.js')).map(name => `tests/${name}`)]);

  console.log('\n--- 2. Running Browser E2E, WebRTC & Test Lab Tests ---');
  for (const name of files.filter(name => name.endsWith('.e2e.js'))) {
    console.log(`\n▶ Running tests/${name}...`);
    await run(process.execPath, ['--test', `tests/${name}`]);
  }

  console.log('\nAll discovered automated tests passed. Test counts are reported by Node above.');
} catch (error) {
  console.error('\n❌ Test suite failed:', error.message);
  process.exit(1);
}
