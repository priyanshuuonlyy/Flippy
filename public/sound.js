/**
 * Flippy Procedural Sound Synthesizer via Web Audio API.
 * Synthesizes subtle chimes, snips, and reaction pops purely in code.
 * 0 byte asset weight, zero network requests, zero CSP issues.
 */

let audioCtx = null;
let soundEnabled = true;

function getContext() {
  if (!soundEnabled) return null;
  if (!audioCtx && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const Sound = {
  setEnabled(enabled) {
    soundEnabled = Boolean(enabled);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('flippy_sound_enabled', soundEnabled ? '1' : '0');
      } catch {}
    }
  },
  isEnabled() {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('flippy_sound_enabled');
        if (saved !== null) soundEnabled = saved === '1';
      } catch {}
    }
    return soundEnabled;
  },
  // Melodic two-tone gentle chime when paired with a new connection
  playMatch() {
    if (!this.isEnabled()) return;
    try {
      const ctx = getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Note 1: C5 (523.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: G5 (783.99 Hz) slightly offset
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.12);
      gain2.gain.setValueAtTime(0.09, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch {}
  },
  // Crisp scissor snip or skip whoosh
  playSkip() {
    if (!this.isEnabled()) return;
    try {
      const ctx = getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.11);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.11);
    } catch {}
  },
  // Playful pop for heart / reactions
  playPop() {
    if (!this.isEnabled()) return;
    try {
      const ctx = getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(850, now + 0.08);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }
};
