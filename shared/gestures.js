const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const validHand = hand => Array.isArray(hand) && hand.length === 21 && hand.every(point => point && Number.isFinite(point.x) && Number.isFinite(point.y));
const palmSize = hand => Math.max(distance(hand[0], hand[9]), distance(hand[5], hand[17]), .025);
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const palmCenter = hand => ({ x: (hand[0].x + hand[5].x + hand[9].x + hand[17].x) / 4, y: (hand[0].y + hand[5].y + hand[9].y + hand[17].y) / 4 });

export function metricHands(hands, width, height) {
  if (!Array.isArray(hands) || hands.length > 2 || !hands.every(validHand) || !(width > 0 && height > 0)) return [];
  const aspect = width / height;
  if (!Number.isFinite(aspect) || aspect < .25 || aspect > 4) return [];
  if (hands.some(hand => hand.some(p => p.x < -.15 || p.x > 1.15 || p.y < -.15 || p.y > 1.15))) return [];
  return hands.map(hand => hand.map(p => ({ ...p, x: p.x * aspect })));
}

export function twoFingersTogether(hand) {
  if (!validHand(hand)) return false;
  const scale = palmSize(hand);
  if (scale < .065 || scale > .65) return false;
  const extended = (tip, joint) => distance(hand[tip], hand[0]) > distance(hand[joint], hand[0]) + scale * .25;
  const first = { x: hand[8].x - hand[5].x, y: hand[8].y - hand[5].y };
  const second = { x: hand[12].x - hand[9].x, y: hand[12].y - hand[9].y };
  const parallel = (first.x * second.x + first.y * second.y) / (Math.hypot(first.x, first.y) * Math.hypot(second.x, second.y));
  const thumbOut = distance(hand[4], hand[0]) > distance(hand[2], hand[0]) + scale * .50;
  return extended(8, 6) && extended(12, 10) && !extended(16, 14) && !extended(20, 18) && !thumbOut
    && distance(hand[8], hand[12]) < scale * .75 && parallel > .80;
}

export function scissorState(hand, { sensitivity = 'balanced' } = {}) {
  if (!validHand(hand)) return null;
  const scale = palmSize(hand);
  if (scale < .065 || scale > .65) return null;
  const extended = (tip, joint) => distance(hand[tip], hand[0]) > distance(hand[joint], hand[0]) + scale * .25;
  if (!extended(8, 6) || !extended(12, 10) || extended(16, 14) || extended(20, 18)) return null;
  const thumbOut = distance(hand[4], hand[0]) > distance(hand[2], hand[0]) + scale * .45;
  if (thumbOut) return null;
  const tipGap = distance(hand[8], hand[12]);
  const openThreshold = sensitivity === 'high' ? scale * .42 : sensitivity === 'strict' ? scale * .50 : scale * .46;
  const closedThreshold = sensitivity === 'high' ? scale * .35 : sensitivity === 'strict' ? scale * .28 : scale * .32;
  if (tipGap > openThreshold) return 'open';
  if (tipGap < closedThreshold) return 'closed';
  return null;
}

export function twoHandHeart(hands) {
  if (!Array.isArray(hands) || hands.length !== 2 || !hands.every(validHand)) return false;
  const [left, right] = [...hands].sort((a, b) => a[0].x - b[0].x);
  const scale = (palmSize(left) + palmSize(right)) / 2;
  const top = midpoint(left[8], right[8]); const bottom = midpoint(left[4], right[4]);
  return distance(left[8], right[8]) < scale * .7 && distance(left[4], right[4]) < scale * .7
    && bottom.y - top.y > scale * .25 && bottom.y - top.y < scale * 2.2
    && Math.abs(top.x - bottom.x) < scale * .85 && right[5].x - left[5].x > scale * .7
    && left[5].x < top.x - scale * .15 && right[5].x > top.x + scale * .15
    && distance(left[0], right[0]) > scale * .7;
}

export class GestureMachine {
  constructor() { this.reset(); }
  reset({ preserveCooldown = false } = {}) {
    const cooldown = preserveCooldown && this.state === 'cooldown' ? this.cooldownUntil : 0;
    this.state = cooldown ? 'cooldown' : 'idle'; this.cooldownUntil = cooldown;
    this.since = 0; this.lastTime = -Infinity; this.releaseSince = null;
    this.anchor = null; this.lastPoint = null; this.tipAnchor = null;
    this.samples = 0; this.path = 0; this.motionSince = null; this.motionSamples = 0;
    this.snips = 0; this.lastScissor = null; this.scissorSince = 0;
    this.snipAnchor = null; this.unmatchedSince = null;
  }
  update(hands, now, { allowScissor = true, allowSwipe = true, sensitivity = 'balanced' } = {}) {
    if (!Number.isFinite(now) || now <= this.lastTime) return null;
    const previousTime = this.lastTime; const gap = now - previousTime; this.lastTime = now;
    if (!Array.isArray(hands) || hands.length > 2 || !hands.every(validHand)) hands = [];
    const heart = twoHandHeart(hands);
    const swipe = allowSwipe && hands.length === 1 && twoFingersTogether(hands[0]);
    if (this.state === 'cooldown') {
      this.releaseSince = heart || swipe ? null : this.releaseSince ?? now;
      if (now >= this.cooldownUntil && this.releaseSince !== null && now - this.releaseSince >= 200) this.state = 'idle';
      return null;
    }
    if (gap > 800) this.state = 'idle';
    if (heart) {
      if (this.state !== 'heart-dwell') { this.state = 'heart-dwell'; this.since = now; this.samples = 0; }
      this.samples++;
      const heartDwell = sensitivity === 'high' ? 380 : sensitivity === 'strict' ? 620 : 500;
      const minSamples = sensitivity === 'high' ? 3 : 4;
      if (now - this.since >= heartDwell && this.samples >= minSamples) return this.fire('heart', now, 2500);
      return null;
    }
    if (allowScissor && hands.length === 1) {
      const scissor = scissorState(hands[0], { sensitivity });
      const palm = palmCenter(hands[0]);
      const scale = palmSize(hands[0]);
      if (scissor) {
        if (!this.snipAnchor) this.snipAnchor = palm;
        const palmDrift = distance(palm, this.snipAnchor);
        if (palmDrift > scale * 0.40) {
          this.snips = 0;
          this.snipAnchor = palm;
          this.lastScissor = scissor;
          this.scissorSince = now;
        } else if (this.lastScissor === null) {
          this.lastScissor = scissor;
          this.scissorSince = now;
        } else if (scissor !== this.lastScissor) {
          const held = now - this.scissorSince;
          const minHeld = sensitivity === 'high' ? 50 : 70;
          if (held < minHeld) {
            this.snips = 0;
          } else {
            if (this.lastScissor === 'open' && scissor === 'closed') {
              this.snips++;
              const triggerHold = sensitivity === 'high' ? 180 : 220;
              if (held >= triggerHold || this.snips >= 2) {
                this.snips = 0;
                this.snipAnchor = null;
                this.lastScissor = null;
                return this.fire('skip', now, 1600);
              }
            }
          }
          this.lastScissor = scissor;
          this.scissorSince = now;
        }
      } else {
        if (now - this.scissorSince > 1000) {
          this.snips = 0;
          this.snipAnchor = null;
          this.lastScissor = null;
        }
      }
    }
    if (!swipe) {
      if (this.state === 'swipe-armed' && hands.length === 1) {
        this.unmatchedSince = this.unmatchedSince ?? now;
        if (now - this.unmatchedSince > 260) {
          this.state = 'idle'; this.unmatchedSince = null; return null;
        }
      } else {
        this.state = 'idle'; this.unmatchedSince = null; return null;
      }
    } else {
      this.unmatchedSince = null;
    }
    const hand = hands[0]; const point = palmCenter(hand); const scale = palmSize(hand);
    const tips = midpoint(hand[8], hand[12]);
    if (!['swipe-dwell', 'swipe-armed'].includes(this.state)) {
      this.state = 'swipe-dwell'; this.since = now; this.anchor = point; this.lastPoint = point;
      this.scale = scale; this.samples = 1; return null;
    }
    if (distance(point, this.lastPoint) > Math.max(.14, this.scale * 1.1)
      || Math.abs(scale / this.scale - 1) > .35
      || Math.abs(point.y - this.anchor.y) > clamp(this.scale * .65, .06, .20)) {
      this.state = 'idle'; return null;
    }
    const step = distance(point, this.lastPoint); this.lastPoint = point;
    const dwellThreshold = sensitivity === 'high' ? 130 : sensitivity === 'strict' ? 220 : 180;
    if (this.state === 'swipe-dwell') {
      this.samples++;
      if (distance(point, this.anchor) > clamp(this.scale * .35, .035, .095)) {
        this.since = now; this.anchor = point; this.samples = 1;
      }
      if (now - this.since >= dwellThreshold && this.samples >= 3) {
        this.state = 'swipe-armed'; this.since = now; this.anchor = point; this.tipAnchor = tips;
        this.path = 0; this.motionSince = null; this.motionSamples = 0;
      }
      return null;
    }
    this.path += step;
    const dx = point.x - this.anchor.x; const horizontal = Math.abs(dx);
    const vertical = Math.abs(point.y - this.anchor.y);
    const requiredMult = sensitivity === 'high' ? .68 : sensitivity === 'strict' ? 1.0 : .85;
    const required = clamp(this.scale * requiredMult, sensitivity === 'high' ? .07 : .09, .28);
    const minVelocity = sensitivity === 'high' ? .14 : sensitivity === 'strict' ? .24 : .18;
    if (now - this.since > 1200) { this.state = 'idle'; return null; }
    if (horizontal > required * .15 && this.motionSince === null) this.motionSince = previousTime;
    if (step > this.scale * .035) this.motionSamples++;
    if (this.motionSince === null) return null;
    const elapsed = now - this.motionSince;
    if (elapsed > 850) { this.state = 'idle'; return null; }
    const tipDx = tips.x - this.tipAnchor.x;
    const coherent = Math.sign(dx) === Math.sign(tipDx) && Math.abs(tipDx - dx) < this.scale * .55;
    const velocity = horizontal / Math.max(elapsed / 1000, 0.001);
    if (horizontal >= required && elapsed >= 80 && this.motionSamples >= 3
      && horizontal >= vertical * 2.2 && horizontal / Math.max(this.path, .001) >= .80
      && velocity >= Math.max(minVelocity, this.scale * 1.2) && coherent) {
      return this.fire('skip', now, 1600);
    }
    return null;
  }
  fire(type, now, cooldown) {
    this.state = 'cooldown'; this.cooldownUntil = now + cooldown; this.releaseSince = null;
    return type;
  }
}
