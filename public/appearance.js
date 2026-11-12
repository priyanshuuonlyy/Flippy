import { PALETTES, sceneTone } from '/shared/appearance.js';

const image = document.querySelector('#sceneImage');
const root = document.documentElement;
let scheduled;
function calibrate() {
  if (!image?.complete || !image.naturalWidth) return;
  try {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 48;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const scale = Math.max(innerWidth / image.naturalWidth, innerHeight / image.naturalHeight);
    const width = innerWidth / scale; const height = innerHeight / scale;
    context.drawImage(image, (image.naturalWidth - width) / 2, (image.naturalHeight - height) / 2, width, height, 0, 0, 48, 48);
    const tone = sceneTone(context.getImageData(0, 0, 48, 48).data);
    if (!tone) return;
    const palette = PALETTES[tone];
    root.dataset.tone = tone;
    root.style.setProperty('--surface-rgb', palette.surface.join(' '));
    root.style.setProperty('--ink', `rgb(${palette.ink.join(' ')})`);
    root.style.setProperty('--secondary-ink', `rgb(${palette.secondary.join(' ')})`);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', `rgb(${palette.surface.join(' ')})`);
  } catch { /* The orientation-based CSS palette remains usable if image sampling is unavailable. */ }
}
image?.addEventListener('load', calibrate);
window.addEventListener('resize', () => { clearTimeout(scheduled); scheduled = setTimeout(calibrate, 160); });
calibrate();
