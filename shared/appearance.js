export const PALETTES = Object.freeze({
  light: { surface: [232, 237, 239], ink: [29, 43, 50], secondary: [63, 80, 88], alpha: .88 },
  dark: { surface: [23, 31, 36], ink: [226, 234, 237], secondary: [184, 199, 206], alpha: .88 }
});

export function luminance(rgb) {
  const linear = rgb.map(value => { const channel = value / 255; return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4; });
  return linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
}

export function contrast(first, second) {
  const a = luminance(first); const b = luminance(second);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}

export function composite(surface, backdrop, alpha) {
  return surface.map((value, index) => value * alpha + backdrop[index] * (1 - alpha));
}

export function sceneTone(pixels) {
  const values = [];
  for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3] > 0) values.push(luminance([pixels[i], pixels[i + 1], pixels[i + 2]]));
  if (!values.length) return null;
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length * .65)] > .19 ? 'light' : 'dark';
}
