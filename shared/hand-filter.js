const separation = (first, second) => Math.hypot(first.x - second.x, first.y - second.y);
const blend = (value, previous, cutoff, seconds) => {
  const alpha = 1 / (1 + 1 / (2 * Math.PI * cutoff * seconds));
  return alpha * value + (1 - alpha) * previous;
};

export class OneEuro {
  constructor(minCutoff = 1.5, beta = 0.65) { this.minCutoff = minCutoff; this.beta = beta; this.time = null; }
  update(value, time, confidence = 1) {
    if (this.time === null || time - this.time > 250) {
      this.time = time; this.raw = value; this.filtered = value; this.velocity = 0; return value;
    }
    if (time <= this.time) return this.filtered;
    const seconds = (time - this.time) / 1000;
    this.velocity = blend((value - this.raw) / seconds, this.velocity, 1, seconds);
    const effectiveBeta = this.beta * Math.max(0.4, Math.min(1.2, confidence || 1));
    this.filtered = blend(value, this.filtered, this.minCutoff + effectiveBeta * Math.abs(this.velocity), seconds);
    this.raw = value; this.time = time; return this.filtered;
  }
}

export class HandFilter {
  constructor() { this.reset(); }
  reset() { this.tracks = []; this.time = -Infinity; }
  update(hands, time) {
    if (!Number.isFinite(time) || time <= this.time) return [];
    if (!Array.isArray(hands) || hands.length > 2 || !hands.every(hand => hand.length === 21 && hand.every(point => Number.isFinite(point.x) && Number.isFinite(point.y)))) {
      this.reset(); return [];
    }
    if (time - this.time > 250 || hands.length !== this.tracks.length) this.tracks = [];
    this.time = time;
    let ordered = hands;
    if (hands.length === 2 && this.tracks.length === 2) {
      const direct = separation(hands[0][0], this.tracks[0].wrist) + separation(hands[1][0], this.tracks[1].wrist);
      const swapped = separation(hands[1][0], this.tracks[0].wrist) + separation(hands[0][0], this.tracks[1].wrist);
      if (Math.abs(direct - swapped) < 0.025 && separation(hands[0][0], hands[1][0]) < 0.12) this.tracks = [];
      else if (swapped < direct) ordered = [hands[1], hands[0]];
    }
    this.tracks = ordered.map((hand, index) => {
      let track = this.tracks[index];
      if (!track || separation(hand[0], track.wrist) > 0.25) track = { filters: hand.map(() => ({ horizontal: new OneEuro(), vertical: new OneEuro() })) };
      track.wrist = { ...hand[0] };
      track.points = hand.map((point, pointIndex) => ({ ...point, x: track.filters[pointIndex].horizontal.update(point.x, time), y: track.filters[pointIndex].vertical.update(point.y, time) }));
      return track;
    });
    return this.tracks.map(track => track.points);
  }
}

export function inferenceSize(width, height, maxSide = 640) {
  if (!(width > 0 && height > 0)) return null;
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { resizeWidth: Math.max(1, Math.round(width * scale)), resizeHeight: Math.max(1, Math.round(height * scale)), resizeQuality: 'low' };
}
