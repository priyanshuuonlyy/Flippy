/**
 * GestureFeedback: Real-time visual and audio micro-feedback for Flippy hand gestures.
 * 
 * Provides:
 *  1. Zero-latency synthetic Web Audio cues (arm tick, swipe swoosh, heart chord).
 *  2. Real-time visual trajectory ribbon on local hand movement.
 *  3. Holographic two-hand heart contour with glowing progress ring (0% -> 100%).
 *  4. Instantaneous horizontal energy sweep on skip trigger.
 */

export class GestureSoundEngine {
  constructor() {
    this.context = null;
    this.enabled = true;
  }

  ensureContext() {
    try {
      if (!this.context && typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.context = new AudioCtx();
      }
      if (this.context && this.context.state === 'suspended') {
        this.context.resume().catch(() => {});
      }
    } catch {
      this.enabled = false;
    }
  }

  playArm() {
    if (!this.enabled) return;
    try {
      this.ensureContext();
      if (!this.context || this.context.state === 'closed') return;
      const now = this.context.currentTime;
      if (!Number.isFinite(now)) return;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      osc.connect(gain);
      gain.connect(this.context.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch { this.enabled = false; }
  }

  playSwipe() {
    if (!this.enabled) return;
    try {
      this.ensureContext();
      if (!this.context || this.context.state === 'closed') return;
      const now = this.context.currentTime;
      if (!Number.isFinite(now)) return;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(960, now + 0.12);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.context.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch { this.enabled = false; }
  }

  playHeart() {
    if (!this.enabled) return;
    try {
      this.ensureContext();
      if (!this.context || this.context.state === 'closed') return;
      const now = this.context.currentTime;
      if (!Number.isFinite(now)) return;
      [523.25, 659.25, 783.99].forEach(freq => {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        osc.connect(gain);
        gain.connect(this.context.destination);
        osc.start(now);
        osc.stop(now + 0.28);
      });
    } catch { this.enabled = false; }
  }
}

export class GestureFeedbackRenderer {
  constructor(canvas, isReducedMotion = () => false) {
    this.canvas = canvas;
    this.context = canvas?.getContext ? canvas.getContext('2d') : null;
    this.reduced = isReducedMotion;
    this.sounds = new GestureSoundEngine();
    this.trail = [];
    this.state = 'idle';
    this.progress = 0;
    this.lastState = 'idle';
    this.heartAnchor = null;
    this.sweep = null;
    this.scissorCut = null;
    this.running = false;
    this.width = 0;
    this.height = 0;
    if (this.canvas && typeof ResizeObserver !== 'undefined') {
      try { new ResizeObserver(() => this.resize()).observe(this.canvas); } catch {}
    }
    this.resize();
  }

  resize() {
    if (!this.canvas) return;
    try {
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      this.width = rect.width;
      this.height = rect.height;
      const scale = Math.min(devicePixelRatio || 1, 2);
      this.canvas.width = rect.width * scale;
      this.canvas.height = rect.height * scale;
      this.context?.setTransform(scale, 0, 0, scale, 0, 0);
    } catch {}
  }

  update(hands, state, progress = 0, aspect = 1) {
    try {
      const now = performance.now();
      this.state = state;
      this.progress = progress;

      // Trigger audio feedback on state transitions
      if (this.state !== this.lastState) {
        if (this.state === 'swipe-armed' || (this.state === 'heart-dwell' && this.lastState !== 'heart-dwell')) {
          this.sounds.playArm();
        }
        this.lastState = this.state;
      }

      const w = this.width || this.canvas?.width || 320;
      const h = this.height || this.canvas?.height || 240;
      const asp = aspect > 0 ? aspect : 1;

      // Capture trajectory for visual trail
      if (hands && hands.length === 1 && (state === 'swipe-dwell' || state === 'swipe-armed')) {
        const hand = hands[0];
        if (hand && hand[8]) {
          const tipX = (hand[8].x / asp) * w;
          const tipY = hand[8].y * h;
          this.trail.push({ x: tipX, y: tipY, time: now });
        }
      }

      // Capture heart anchor when forming two-hand heart
      if (hands && hands.length === 2 && state === 'heart-dwell') {
        const [left, right] = [...hands].sort((a, b) => a[0].x - b[0].x);
        if (left && right && left[8] && right[8] && left[4] && right[4]) {
          const topX = (((left[8].x + right[8].x) / 2) / asp) * w;
          const topY = ((left[8].y + right[8].y) / 2) * h;
          const bottomX = (((left[4].x + right[4].x) / 2) / asp) * w;
          const bottomY = ((left[4].y + right[4].y) / 2) * h;
          this.heartAnchor = { topX, topY, bottomX, bottomY };
        }
      } else if (state !== 'heart-dwell') {
        this.heartAnchor = null;
      }

      // Clean old trail points (>350ms)
      this.trail = this.trail.filter(pt => now - pt.time < 350);

      if ((this.trail.length > 0 || this.heartAnchor || this.sweep) && !this.running) {
        this.running = true;
        requestAnimationFrame(time => this.render(time));
      }
    } catch {}
  }

  triggerSkip() {
    try {
      this.sounds.playSwipe();
      this.sweep = { born: performance.now(), duration: 280 };
      this.trail = [];
      if (!this.running) {
        this.running = true;
        requestAnimationFrame(time => this.render(time));
      }
    } catch {}
  }

  triggerScissor(point = null) {
    try {
      this.sounds.playSwipe();
      const now = performance.now();
      const w = this.width || this.canvas?.width || 320;
      const h = this.height || this.canvas?.height || 240;
      const cx = point ? point.x : w / 2;
      const cy = point ? point.y : h / 2;
      this.scissorCut = { born: now, duration: 320, x: cx, y: cy };
      if (!this.running) {
        this.running = true;
        requestAnimationFrame(time => this.render(time));
      }
    } catch {}
  }

  triggerHeart() {
    try {
      this.sounds.playHeart();
      this.heartAnchor = null;
    } catch {}
  }

  render(now) {
    try {
      const w = this.width || this.canvas?.width || 320;
      const h = this.height || this.canvas?.height || 240;
      const ctx = this.context;
      if (!ctx) { this.running = false; return; }

      if (this.reduced()) {
        this.trail = [];
        this.sweep = null;
        this.scissorCut = null;
        ctx.clearRect(0, 0, w, h);
        this.running = false;
        return;
      }

      ctx.clearRect(0, 0, w, h);

      // Clean trail
      this.trail = this.trail.filter(pt => now - pt.time < 350);

      // 1. Draw glowing skip energy sweep
      if (this.sweep) {
        const elapsed = now - this.sweep.born;
        if (elapsed > this.sweep.duration) {
          this.sweep = null;
        } else {
          const p = elapsed / this.sweep.duration;
          const alpha = Math.sin(p * Math.PI) * 0.45;
          const x = p * w;
          const grad = ctx.createLinearGradient(x - 120, 0, x + 60, 0);
          grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
          grad.addColorStop(0.7, `rgba(56, 189, 248, ${alpha})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(x - 120, 0, 180, h);
        }
      }

      // 2. Draw Trajectory Ribbon (Fingertip motion arc)
      if (this.trail.length >= 2) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let i = 1; i < this.trail.length; i++) {
          const prev = this.trail[i - 1];
          const curr = this.trail[i];
          const age = now - curr.time;
          const alpha = Math.max(0, 1 - age / 350);
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(curr.x, curr.y);
          ctx.lineWidth = 3 + alpha * 5;
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.75})`;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 10;
          ctx.stroke();
        }
        ctx.restore();
      }

      // 3. Draw Holographic Two-Hand Heart Contour & Progress Arc
      if (this.heartAnchor && this.state === 'heart-dwell') {
        const { topX, topY, bottomX, bottomY } = this.heartAnchor;
        const midX = (topX + bottomX) / 2;
        const midY = (topY + bottomY) / 2;
        const radius = Math.max(25, Math.hypot(topX - bottomX, topY - bottomY) * 0.7);

        ctx.save();
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 14;
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
        ctx.beginPath();
        ctx.arc(midX, midY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Progress fill ring
        if (this.progress > 0) {
          ctx.lineWidth = 4.5;
          ctx.strokeStyle = '#f43f5e';
          ctx.beginPath();
          const startAngle = -Math.PI / 2;
          const endAngle = startAngle + (Math.PI * 2 * (this.progress / 100));
          ctx.arc(midX, midY, radius, startAngle, endAngle);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 4. Draw Scissor Snip Cut Flash
      if (this.scissorCut) {
        const elapsed = now - this.scissorCut.born;
        if (elapsed > this.scissorCut.duration) {
          this.scissorCut = null;
        } else {
          const p = elapsed / this.scissorCut.duration;
          const alpha = (1 - p) * 0.9;
          const len = 35 + p * 50;
          ctx.save();
          ctx.translate(this.scissorCut.x, this.scissorCut.y);
          ctx.strokeStyle = `rgba(245, 158, 11, ${alpha})`;
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 12;
          ctx.lineWidth = 3;

          ctx.beginPath();
          ctx.moveTo(-len * 0.7, -len * 0.5);
          ctx.lineTo(len * 0.7, len * 0.5);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(-len * 0.7, len * 0.5);
          ctx.lineTo(len * 0.7, -len * 0.5);
          ctx.stroke();

          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(0, 0, 3 + (1 - p) * 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      if (this.trail.length > 0 || this.heartAnchor || this.sweep || this.scissorCut) {
        requestAnimationFrame(time => this.render(time));
      } else {
        this.running = false;
      }
    } catch {
      this.running = false;
    }
  }
}
