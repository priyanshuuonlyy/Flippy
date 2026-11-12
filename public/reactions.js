export class HeartBalloons {
  constructor(canvas, reduced = () => false) {
    this.canvas = canvas; this.context = canvas.getContext('2d'); this.reduced = reduced;
    this.particles = []; this.seen = new Set(); this.running = false;
    new ResizeObserver(() => this.resize()).observe(canvas); this.resize();
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect(); this.width = rect.width; this.height = rect.height;
    const scale = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = rect.width * scale; this.canvas.height = rect.height * scale;
    this.context.setTransform(scale, 0, 0, scale, 0, 0);
  }
  burst(event) {
    if (this.seen.has(event.id)) return;
    this.seen.add(event.id); if (this.seen.size > 64) this.seen.delete(this.seen.values().next().value);
    let seed = event.seed >>> 0;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const reduced = this.reduced();
    const kind = event.kind || 'heart';
    for (let index = 0; index < (reduced ? 14 : 72); index++) {
      this.particles.push({
        born: performance.now() + random() * 850,
        duration: reduced ? 1800 : 3400 + random() * 2200,
        x: 0.06 + random() * 0.88,
        size: 10 + random() ** 2 * 22,
        drift: (random() - 0.5) * 110,
        phase: random() * Math.PI * 2,
        rotation: (random() - 0.5) * 0.5,
        kind,
        reduced
      });
    }
    this.particles = this.particles.slice(-180);
    if (!this.running) { this.running = true; requestAnimationFrame(time => this.draw(time)); }
  }
  draw(now) {
    const context = this.context;
    context.clearRect(0, 0, this.width, this.height);
    this.particles = this.particles.filter(particle => now < particle.born + particle.duration);
    const shade = this.particles.reduce((maximum, particle) => {
      const progress = (now - particle.born) / particle.duration;
      return Math.max(maximum, progress < 0 ? 0 : Math.min(1, progress * 8) * (1 - progress));
    }, 0);
    context.fillStyle = `rgba(0, 0, 0, ${shade * 0.15})`;
    context.fillRect(0, 0, this.width, this.height);
    for (const particle of this.particles) {
      const progress = (now - particle.born) / particle.duration;
      if (progress < 0) continue;
      const opacity = Math.min(1, progress * 8) * (1 - progress) ** 0.7;
      const horizontal = particle.x * this.width + (particle.reduced ? 0 : Math.sin(progress * 4 + particle.phase) * 18 + particle.drift * progress);
      const vertical = particle.reduced ? this.height * (0.2 + particle.x * 0.6) : this.height + 30 - progress * (this.height + 100);
      context.save();
      context.translate(horizontal, vertical);
      context.rotate(particle.rotation);
      context.globalAlpha = opacity;
      if (particle.kind === 'heart') {
        context.scale(particle.size / 20, particle.size / 20);
        context.strokeStyle = '#ff335c';
        context.lineWidth = 1.4;
        context.shadowColor = '#ff123f';
        context.shadowBlur = 14;
        context.beginPath();
        context.moveTo(0, 7);
        context.bezierCurveTo(-27, -9, -16, -27, 0, -14);
        context.bezierCurveTo(16, -27, 27, -9, 0, 7);
        context.stroke();
      } else {
        const glyphMap = { laugh: '😂', fire: '🔥', clap: '👏', sparkles: '✨' };
        const glowMap = { laugh: '#f59e0b', fire: '#ea580c', clap: '#10b981', sparkles: '#06b6d4' };
        const glyph = glyphMap[particle.kind] || '✨';
        context.font = `${Math.round(particle.size * 1.4)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.shadowColor = glowMap[particle.kind] || '#06b6d4';
        context.shadowBlur = 16;
        context.fillText(glyph, 0, 0);
      }
      context.restore();
    }
    if (this.particles.length) requestAnimationFrame(time => this.draw(time)); else this.running = false;
  }
}
