import test from 'node:test';
import assert from 'node:assert/strict';
import { GestureMachine, twoFingersTogether, twoHandHeart, metricHands } from '../shared/gestures.js';
import { HandFilter } from '../shared/hand-filter.js';

function swipeHand(horizontal = 0, vertical = 0) {
  const points = Array.from({ length: 21 }, () => ({ x: 0.5 + horizontal, y: 0.7 + vertical }));
  const set = (index, horizontalPosition, verticalPosition) => { points[index] = { x: horizontalPosition + horizontal, y: verticalPosition + vertical }; };
  set(0, .5, .85); set(9, .5, .65); set(5, .45, .65); set(17, .59, .69);
  set(6, .46, .5); set(8, .46, .3); set(10, .52, .5); set(12, .52, .3);
  set(14, .56, .58); set(16, .56, .71); set(18, .59, .62); set(20, .59, .73);
  return points;
}
function heartHands() {
  return [0, 1].map(side => {
    const hand = Array.from({ length: 21 }, () => ({ x: side ? .65 : .35, y: .6 }));
    hand[0] = { x: side ? .7 : .3, y: .7 }; hand[9] = { x: side ? .65 : .35, y: .5 };
    hand[5] = { x: side ? .65 : .35, y: .4 }; hand[17] = { x: side ? .72 : .28, y: .6 };
    hand[8] = { x: side ? .51 : .49, y: .4 }; hand[4] = { x: side ? .51 : .49, y: .6 };
    return hand;
  });
}
test('stationary two-finger pose never skips; V-sign is rejected', () => {
  const machine = new GestureMachine();
  for (let time = 0; time < 5000; time += 80) assert.equal(machine.update([swipeHand()], time), null);
  const separated = swipeHand(); separated[12].x += .2; assert.equal(twoFingersTogether(separated), false);
});
test('held fingers then horizontal movement trigger exactly one skip until release', () => {
  const machine = new GestureMachine();
  for (const time of [0, 80, 160, 240]) assert.equal(machine.update([swipeHand()], time), null);
  assert.equal(machine.update([swipeHand(.07)], 320), null);
  assert.equal(machine.update([swipeHand(.14)], 400), null);
  assert.equal(machine.update([swipeHand(.21)], 480), 'skip');
  for (let time = 560; time < 4000; time += 80) assert.equal(machine.update([swipeHand(.21)], time), null);
  machine.update([], 4000); machine.update([], 4240); assert.equal(machine.state, 'idle');
});
test('vertical moves, discontinuities and lost hands do not skip', () => {
  for (const movement of [swipeHand(0, .2), swipeHand(.35), null]) {
    const machine = new GestureMachine();
    for (const time of [0, 100, 200]) machine.update([swipeHand()], time);
    assert.equal(machine.update(movement ? [movement] : [], 300), null);
    assert.equal(machine.state, 'idle');
  }
});
test('a long inference gap cannot complete a swipe or a heart', () => {
  const machine = new GestureMachine(); machine.update(heartHands(), 0);
  assert.equal(machine.update(heartHands(), 1000), null);
  assert.equal(machine.update(heartHands(), 900), null);
});
test('two-hand heart requires sustained geometry, fires once, has no audio action', () => {
  const hands = heartHands(); assert.equal(twoHandHeart(hands), true); assert.equal(twoHandHeart(hands.slice(0, 1)), false);
  const machine = new GestureMachine(); const actions = [];
  for (let time = 0; time < 4000; time += 100) { const action = machine.update(hands, time); if (action) actions.push(action); }
  assert.deepEqual(actions, ['heart']);
  hands[1][4].x += .3; assert.equal(twoHandHeart(hands), false);
});

function sequence({ direction = 1, scale = 1, aspect = 1, interval = 80, rotate = 0 } = {}) {
  const machine = new GestureMachine(); const actions = [];
  const transform = offset => swipeHand().map(p => {
    const x = (p.x - .5) * scale; const y = (p.y - .6) * scale;
    const center = aspect / 2 - direction * Math.max(.12, .24 * scale) / 2;
    return { x: (center + x * Math.cos(rotate) - y * Math.sin(rotate) + offset) / aspect, y: .6 + x * Math.sin(rotate) + y * Math.cos(rotate) };
  });
  const pose = offset => metricHands([transform(offset)], aspect * 1000, 1000);
  let time = 0;
  while (time <= Math.max(240, interval * 2)) { const action = machine.update(pose(0), time); if (action) actions.push(action); time += interval; }
  for (const progress of [.25, .5, .75, 1]) {
    const action = machine.update(pose(direction * Math.max(.12, .24 * scale) * progress), time);
    if (action) actions.push(action); time += interval;
  }
  return actions;
}

test('both swipe directions survive portrait, landscape, camera distance and hand roll', () => {
  for (const aspect of [9 / 16, 1, 4 / 3, 16 / 9]) for (const direction of [-1, 1]) for (const scale of [.55, 1, 1.4]) {
    assert.deepEqual(sequence({ aspect, direction, scale, rotate: .2 }), ['skip'], JSON.stringify({ aspect, direction, scale }));
  }
});

test('deliberate swipes work at 30, 15, 10 and 5 sampled frames per second', () => {
  for (const interval of [33, 66, 100, 200]) assert.deepEqual(sequence({ interval }), ['skip'], String(interval));
});

test('diagonal swipes are rejected even when horizontal displacement exceeds the old threshold', () => {
  const machine = new GestureMachine();
  for (const time of [0, 80, 160, 240]) machine.update([swipeHand()], time);
  for (let i = 1; i <= 4; i++) assert.equal(machine.update([swipeHand(i * .055, i * .035)], 240 + i * 80), null);
});

test('fingertip movement with a stationary palm cannot skip', () => {
  const machine = new GestureMachine();
  for (const time of [0, 80, 160, 240]) machine.update([swipeHand()], time);
  for (let i = 1; i <= 4; i++) {
    const hand = swipeHand(); for (const tip of [8, 12]) hand[tip].x += i * .055;
    assert.equal(machine.update([hand], 240 + i * 80), null);
  }
});

test('zigzag paths, slow drifting and one-frame jumps do not skip', () => {
  for (const offsets of [[.06, -.06, .07, -.07, .12, .2], [.01, .02, .03, .04, .05, .06, .07, .08, .09], [.2]]) {
    const machine = new GestureMachine();
    for (const time of [0, 80, 160, 240]) machine.update([swipeHand()], time);
    offsets.forEach((offset, i) => assert.equal(machine.update([swipeHand(offset)], 240 + (i + 1) * 100), null));
  }
});

test('stationary landmark jitter cannot accumulate into a skip', () => {
  const machine = new GestureMachine();
  for (let i = 0; i < 200; i++) assert.equal(machine.update([swipeHand(Math.sin(i) * .009, Math.cos(i) * .008)], i * 66), null);
});

test('moving closer to the camera cancels an armed swipe', () => {
  const machine = new GestureMachine();
  for (const time of [0, 80, 160, 240]) machine.update([swipeHand()], time);
  const zoomed = swipeHand().map(p => ({ x: .5 + (p.x - .5) * 1.5, y: .6 + (p.y - .6) * 1.5 }));
  assert.equal(machine.update([zoomed], 320), null); assert.equal(machine.state, 'idle');
});

test('a room change preserves gesture cooldown and requires release before rearming', () => {
  const machine = new GestureMachine(); machine.fire('skip', 500, 1600); machine.reset({ preserveCooldown: true });
  for (let time = 600; time <= 3000; time += 80) assert.equal(machine.update([swipeHand()], time), null);
  assert.equal(machine.state, 'cooldown');
  machine.update([], 3100); machine.update([], 3340); assert.equal(machine.state, 'idle');
});

test('invalid, missing and very small hands cannot arm a gesture', () => {
  const machine = new GestureMachine();
  for (const hands of [null, {}, [[null]], [[{ x: NaN, y: 0 }]]]) assert.deepEqual(metricHands(hands, 1280, 720), []);
  assert.equal(machine.update(null, 0), null); assert.equal(twoHandHeart(null), false);
  assert.deepEqual(metricHands([swipeHand()], 0, 720), []);
  const tiny = swipeHand().map(p => ({ x: .5 + (p.x - .5) * .2, y: .5 + (p.y - .5) * .2 }));
  assert.equal(twoFingersTogether(tiny), false);
});

test('the production smoothing pipeline preserves a complete swipe with ordinary landmark noise', () => {
  for (const interval of [33, 66, 100, 200]) {
    const filter = new HandFilter(); const machine = new GestureMachine(); const actions = [];
    for (let time = 0; time <= 1500; time += interval) {
      const offset = Math.min(.24, Math.max(0, time - 400) / 400 * .24);
      const hand = swipeHand(offset + Math.sin(time) * .002);
      const action = machine.update(filter.update([hand], time), time);
      if (action) actions.push(action);
    }
    assert.deepEqual(actions, ['skip'], String(interval));
  }
});

test('two-finger double scissor snip triggers skip without horizontal movement', () => {
  const machine = new GestureMachine();
  const hand = swipeHand();
  // Snip 1: open -> close
  hand[12].x += 0.12;
  assert.equal(machine.update([hand], 100), null);
  hand[12].x -= 0.12;
  assert.equal(machine.update([hand], 200), null);
  // Snip 2: open -> close
  hand[12].x += 0.12;
  assert.equal(machine.update([hand], 350), null);
  hand[12].x -= 0.12;
  assert.equal(machine.update([hand], 500), 'skip');
});

test('rapid jitter cannot trigger scissor skip', () => {
  const machine = new GestureMachine();
  const hand = swipeHand();
  for (let t = 0; t < 1000; t += 30) {
    if (t % 60 === 0) hand[12].x += 0.12;
    else hand[12].x -= 0.12;
    assert.equal(machine.update([hand], t), null);
  }
});


