import { frameStatistics } from '../shared/health.js';

export class CameraSampler {
  constructor(video, { createCanvas = () => document.createElement('canvas'), now = () => performance.now() } = {}) {
    this.now = now;
    this.video = video; this.stream = null; this.frames = 0; this.lastFrame = -Infinity;
    this.previous = null; this.lastTime = -1; this.frameHandle = null;
    this.metrics = { mean: 0, variance: 0, motion: 0 }; this.maxMotion = 0;
    this.canvas = createCanvas(); this.canvas.width = 64; this.canvas.height = 48;
    this.context = this.canvas.getContext('2d', { willReadFrequently: true });
  }
  attach(stream) {
    this.detach(); this.stream = stream; this.previous = null; this.lastTime = -1; this.lastFrame = -Infinity;
    this.metrics = { mean: 0, variance: 0, motion: 0 }; this.maxMotion = 0;
    if (this.video.requestVideoFrameCallback) {
      const generation = this.generation;
      const frame = () => {
        if (generation !== this.generation) return;
        this.frames++; this.lastFrame = this.now(); this.frameHandle = this.video.requestVideoFrameCallback(frame);
      };
      this.frameHandle = this.video.requestVideoFrameCallback(frame);
    }
  }
  detach() {
    this.generation = (this.generation ?? 0) + 1;
    if (this.frameHandle !== null) this.video.cancelVideoFrameCallback?.(this.frameHandle);
    this.frameHandle = null; this.stream = null;
  }
  sample() {
    if (!this.stream || this.video.readyState < 2) return;
    const now = this.now();
    if (!this.video.requestVideoFrameCallback && Number.isFinite(this.video.currentTime) && this.video.currentTime !== this.lastTime) {
      this.frames++;
      this.lastFrame = now;
      this.lastTime = this.video.currentTime;
    }
    try {
      this.context.drawImage(this.video, 0, 0, 64, 48);
      const pixels = this.context.getImageData(0, 0, 64, 48).data;
      this.metrics = frameStatistics(pixels, this.previous); this.previous = pixels;
      this.maxMotion = Math.max(this.maxMotion, this.metrics.motion);
    } catch { this.lastFrame = -Infinity; }
  }
  telemetry(lowLight) {
    const track = this.stream?.getVideoTracks()[0];
    const sample = { permission: !!track, live: track?.readyState === 'live', enabled: track?.enabled ?? false,
      muted: track?.muted ?? true, lowLight, frames: this.frames,
      frameAge: Math.min(3600000, this.now() - this.lastFrame), ...this.metrics, motion: this.maxMotion };
    this.maxMotion = 0; return sample;
  }
}
