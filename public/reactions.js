/**
 * Flippy-native reaction particles. Every kind is vector drawn to keep the
 * animation consistent across Android, iOS and desktop emoji font stacks.
 * The live video itself is never tinted or dimmed by a reaction burst.
 */
export const REACTION_KINDS = Object.freeze(['heart', 'laugh', 'fire', 'clap', 'sparkles']);
const PALETTE = Object.freeze({
  heart: '#ff466b', laugh: '#e7bc86', fire: '#ff9869',
  clap: '#a6d8d2', sparkles: '#ccb7ed'
});

function drawGlyph(context, kind) {
  context.beginPath();
  if (kind === 'heart') {
    context.moveTo(12, 21);
    context.bezierCurveTo(7, 17, 2, 13, 2, 8.5);
    context.bezierCurveTo(2, 3, 8, 2, 12, 7);
    context.bezierCurveTo(16, 2, 22, 3, 22, 8.5);
    context.bezierCurveTo(22, 13, 17, 17, 12, 21);
  } else if (kind === 'laugh') {
    context.arc(12, 12, 9, 0, Math.PI * 2);
    context.moveTo(8, 14); context.quadraticCurveTo(12, 18.5, 16, 14);
    context.moveTo(8, 10); context.lineTo(8.1, 10);
    context.moveTo(16, 10); context.lineTo(16.1, 10);
  } else if (kind === 'fire') {
    context.moveTo(12, 22);
    context.bezierCurveTo(6, 22, 4, 18, 4, 14);
    context.bezierCurveTo(4, 11, 6, 8, 9, 6);
    context.bezierCurveTo(9, 9, 11, 10, 12, 10);
    context.bezierCurveTo(14, 7, 14, 4, 13, 2);
    context.bezierCurveTo(18, 5, 20, 10, 20, 14);
    context.bezierCurveTo(20, 18, 18, 22, 12, 22);
    context.moveTo(12, 22);
    context.bezierCurveTo(9, 22, 9, 19, 10.5, 17);
    context.bezierCurveTo(12, 15, 13, 15, 13.5, 13);
    context.bezierCurveTo(16, 16, 17, 19, 15, 21);
  } else if (kind === 'clap') {
    context.moveTo(8, 13); context.lineTo(8, 6);
    context.bezierCurveTo(8, 4, 11, 4, 11, 6);
    context.lineTo(11, 11); context.lineTo(11, 4);
    context.bezierCurveTo(11, 2, 14, 2, 14, 4);
    context.lineTo(14, 11); context.lineTo(14, 6);
    context.bezierCurveTo(14, 4, 17, 4, 17, 6);
    context.lineTo(17, 13); context.lineTo(17, 10);
    context.bezierCurveTo(17, 8, 20, 8, 20, 10);
    context.lineTo(20, 16);
    context.bezierCurveTo(20, 20, 17, 22, 13, 22);
    context.bezierCurveTo(9, 22, 8, 19, 5, 15);
    context.bezierCurveTo(3, 12, 6, 11, 8, 14);
  } else {
    context.moveTo(12, 2); context.lineTo(14.5, 9);
    context.lineTo(21, 12); context.lineTo(14.5, 14.5);
    context.lineTo(12, 21); context.lineTo(9.5, 14.5);
    context.lineTo(3, 12); context.lineTo(9.5, 9);
    context.closePath();
    context.moveTo(20, 2); context.lineTo(20, 6);
    context.moveTo(18, 4); context.lineTo(22, 4);
  }
  context.stroke();
}

export class HeartBalloons {
  constructor(canvas, reduced = () => false) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.reduced = reduced;
    this.particles = [];
    this.seen = new Set();
    this.running = false;
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    const scale = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = rect.width * scale;
    this.canvas.height = rect.height * scale;
    this.context.setTransform(scale, 0, 0, scale, 0, 0);
  }
  burst(event) {
    if (this.seen.has(event.id)) return;
    this.seen.add(event.id);
    if (this.seen.size > 64) this.seen.delete(this.seen.values().next().value);
    let seed = event.seed >>> 0;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const reduced = this.reduced();
    const kind = REACTION_KINDS.includes(event.kind) ? event.kind : 'heart';
    for (let index = 0; index < (reduced ? 8 : 44); index++) {
      this.particles.push({
        born: performance.now() + random() * (reduced ? 100 : 700),
        duration: reduced ? 1050 : 2700 + random() * 1400,
        x: 0.07 + random() * 0.86,
        size: 10 + random() ** 2 * 22,
        drift: (random() - 0.5) * 88,
        phase: random() * Math.PI * 2,
        rotation: (random() - 0.5) * 0.32,
        kind,
        reduced
      });
    }
    this.particles = this.particles.slice(-128);
    if (!this.running) { this.running = true; requestAnimationFrame(time => this.draw(time)); }
  }
  draw(now) {
    const context = this.context;
    context.clearRect(0, 0, this.width, this.height);
    this.particles = this.particles.filter(particle => now < particle.born + particle.duration);
    for (const particle of this.particles) {
      const progress = (now - particle.born) / particle.duration;
      if (progress < 0) continue;
      const opacity = Math.min(1, progress * 8) * (1 - progress) ** 0.75;
      const horizontal = particle.x * this.width + (particle.reduced ? 0 : Math.sin(progress * 4 + particle.phase) * 13 + particle.drift * progress);
      const vertical = particle.reduced ? this.height * (0.2 + particle.x * 0.6) : this.height + 28 - progress * (this.height + 92);
      context.save();
      context.translate(horizontal, vertical);
      context.rotate(particle.rotation);
      context.scale(particle.size / 24, particle.size / 24);
      context.translate(-12, -12);
      context.globalAlpha = opacity;
      context.strokeStyle = PALETTE[particle.kind];
      context.lineWidth = 1.75;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.shadowColor = PALETTE[particle.kind];
      context.shadowBlur = particle.kind === 'heart' ? 10 : 7;
      drawGlyph(context, particle.kind);
      context.restore();
    }
    if (this.particles.length) requestAnimationFrame(time => this.draw(time));
    else this.running = false;
  }
}
