export const HEALTH = Object.freeze({ graceMs: 120000, recoveryMs: 3000, leaseMs: 7000, staleFrameMs: 4000, frozenMs: 15000 });

export function frameStatistics(pixels, previous) {
  let sum = 0;
  let squares = 0;
  let difference = 0;
  const count = pixels.length / 4;
  for (let offset = 0; offset < pixels.length; offset += 4) {
    const value = pixels[offset] * 0.2126 + pixels[offset + 1] * 0.7152 + pixels[offset + 2] * 0.0722;
    sum += value; squares += value * value;
    if (previous) difference += Math.abs(value - (previous[offset] * 0.2126 + previous[offset + 1] * 0.7152 + previous[offset + 2] * 0.0722));
  }
  const mean = sum / count;
  return { mean, variance: Math.max(0, squares / count - mean * mean), motion: previous ? difference / count : 0 };
}

export function validSample(sample) {
  if (!sample || typeof sample !== 'object') return false;
  if (!['permission', 'live', 'enabled', 'muted', 'lowLight'].every(key => typeof sample[key] === 'boolean')) return false;
  return ['frames', 'frameAge', 'mean', 'variance', 'motion'].every(key => Number.isFinite(sample[key]) && sample[key] >= 0)
    && Number.isSafeInteger(sample.frames) && sample.frameAge <= 3600000
    && sample.mean <= 255 && sample.variance <= 65025 && sample.motion <= 255;
}

export class CameraGate {
  constructor() {
    this.lastHeartbeat = -Infinity; this.lastFrames = null; this.lastMotion = null;
    this.badSince = null; this.goodSince = null; this.eligible = false; this.state = 'off'; this.reason = 'Camera required';
  }
  observe(sample, now) {
    if (!validSample(sample)) return false;
    const lapse = now - this.lastHeartbeat > HEALTH.leaseMs;
    this.lastHeartbeat = now;
    const advancing = this.lastFrames === null || sample.frames > this.lastFrames;
    this.lastFrames = sample.frames;
    if (lapse) { this.goodSince = null; this.lastMotion = now; this.eligible = false; }
    if (sample.motion >= 0.025) this.lastMotion = now;
    const off = !sample.permission || !sample.live || !sample.enabled || sample.muted;
    const black = sample.lowLight ? sample.mean < 1.5 && sample.variance < 0.7 : sample.mean < 5 && sample.variance < 2;
    const frozen = now - this.lastMotion >= HEALTH.frozenMs;
    const unusable = black || frozen || !advancing || sample.frameAge > HEALTH.staleFrameMs;
    if (off || unusable) {
      this.goodSince = null;
      this.badSince ??= now;
      this.reason = off ? 'Camera is off or unavailable' : black ? 'Camera view is too dark' : 'Camera frames are not updating';
      if (off || now - this.badSince >= HEALTH.graceMs) { this.eligible = false; this.state = 'paused'; }
      else this.state = 'warning';
    } else {
      this.goodSince ??= now;
      if (now - this.goodSince >= HEALTH.recoveryMs) {
        this.eligible = true; this.badSince = null; this.state = 'ready'; this.reason = 'Camera ready';
      } else { this.state = 'recovering'; this.reason = 'Checking live camera'; }
    }
    return true;
  }
  check(now) {
    if (now - this.lastHeartbeat > HEALTH.leaseMs) {
      this.eligible = false; this.goodSince = null; this.state = 'paused'; this.reason = 'Camera heartbeat lost';
    }
    if (this.badSince !== null && now - this.badSince >= HEALTH.graceMs) {
      this.eligible = false; this.state = 'paused';
    }
    return this.eligible;
  }
  status(now) {
    this.check(now);
    return { eligible: this.eligible, state: this.state, reason: this.reason,
      remainingMs: this.badSince === null ? null : Math.max(0, HEALTH.graceMs - (now - this.badSince)) };
  }
}
