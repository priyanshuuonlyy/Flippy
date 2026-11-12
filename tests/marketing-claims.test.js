import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');

test('public SEO and FAQ claims distinguish actual features from planned safety tools', () => {
  const unverified = [
    /zero bots/i,
    /verified real humans/i,
    /100% real faces/i,
    /instant ban/i,
    /nudity-free/i,
    /strict community moderation/i,
    /predatory bad actors/i,
    /human-only matching/i
  ];
  for (const phrase of unverified) assert.doesNotMatch(html, phrase);
  assert.match(html, /Moderation and reporting tools are under development/);
  assert.match(html, /Camera activity checks are not a substitute for content moderation/);
  assert.match(html, /No account or payment is currently required/);
  assert.match(html, /Developed by Doer/);
});

test('metadata and structured FAQ remain valid with truthful descriptions', () => {
  const script = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(script, 'JSON-LD exists');
  const data = JSON.parse(script[1]);
  assert.ok(Array.isArray(data['@graph']));
  assert.equal(data['@graph'].find(item => item['@type'] === 'WebApplication').offers.price, '0');
  for (const route of ['#about', '#safety', '#faq', '#guide']) assert.ok(html.includes('href="' + route + '"'));
});

test('SEO cards reuse Flippy line icons instead of stock emoji badges', () => {
  const cardHeadings = html.match(/<h4>.*?<\/h4>/g) || [];
  assert.equal(cardHeadings.length, 4);
  for (const heading of cardHeadings) {
    assert.ok(heading.includes('<svg class="icon"'), heading);
    assert.doesNotMatch(heading, /<span>[^<]*<\/span>/);
  }
});
