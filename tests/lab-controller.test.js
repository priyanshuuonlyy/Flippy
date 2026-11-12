import test from 'node:test';
import assert from 'node:assert/strict';
import { LabController } from '../server/lab-controller.js';

test('connected test bots never press the heart control during polling', async () => {
  const controller = new LabController('http://localhost:3300');
  const controls = [];
  const bot = { id: 'Test partner', state: 'chatting', reactions: 0, lastReaction: 0, page: {
    evaluate: async () => 'chatting',
    locator: selector => { controls.push(selector); return { click: async () => {} }; }
  } };
  controller.browser = {};
  controller.bots = [bot];
  try {
    for (let count = 0; count < 3; count++) {
      await controller.poll(); clearTimeout(controller.timer);
    }
    assert.deepEqual(controls, []);
    assert.equal(bot.reactions, 0);
    assert.equal(bot.state, 'chatting');
  } finally { controller.stopping = true; clearTimeout(controller.timer); }
});
