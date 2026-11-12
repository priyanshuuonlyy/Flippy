import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const outDir = 'C:/Users/PRIYANSHU DESHLAN/.gemini/antigravity/brain/8aadd0eb-60af-4626-97d8-984e419ae518/video_frames';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const videoPath = 'C:/Users/PRIYANSHU DESHLAN/Downloads/flippy-gesture-test.webm';
const videoUrl = 'file:///' + videoPath.replace(/\\/g, '/');

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
await page.goto(videoUrl);

await page.waitForFunction(() => {
  const v = document.querySelector('video');
  return v && v.duration > 0;
});

const duration = await page.evaluate(() => document.querySelector('video').duration);
console.log('Video duration:', duration);

for (let s = 1; s < duration; s += 2) {
  await page.evaluate(time => {
    const v = document.querySelector('video');
    v.currentTime = time;
  }, s);
  await page.waitForTimeout(300);
  const outPath = path.join(outDir, `frame_${s.toFixed(1)}s.png`);
  await page.screenshot({ path: outPath });
  console.log(`Captured frame at ${s.toFixed(1)}s -> ${outPath}`);
}

await browser.close();
console.log('Done capturing frames!');
