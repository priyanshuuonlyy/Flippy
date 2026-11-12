import test from 'node:test';
import assert from 'node:assert/strict';
import { SUPPORTED_LANGUAGES, TRANSLATIONS, t, setLanguage, getLanguage } from '../public/i18n.js';

test('i18n supports the 6 international expansion languages and excludes Hindi', () => {
  const codes = Object.keys(SUPPORTED_LANGUAGES);
  assert.deepEqual(codes.sort(), ['de', 'en', 'es', 'fr', 'pt', 'tr']);
  assert.equal(codes.includes('hi'), false, 'Hindi is excluded per user request');
});

test('all supported languages have required key translations', () => {
  const requiredKeys = [
    'headerTitle',
    'leaveBtn',
    'labelIdle',
    'labelSearching',
    'labelChatting',
    'btnEnableMedia',
    'btnStart',
    'btnNext',
    'noticeAllowMedia',
    'settingsSummary',
    'langSelectLabel',
    'aboutH2',
    'safetyH2',
    'faqH2'
  ];

  for (const [code, dict] of Object.entries(TRANSLATIONS)) {
    for (const key of requiredKeys) {
      assert.ok(dict[key], `Language ${code} missing translation for ${key}`);
      assert.equal(typeof dict[key], 'string', `Language ${code} key ${key} should be string`);
      assert.ok(dict[key].trim().length > 0, `Language ${code} key ${key} should not be empty`);
    }
  }
});

test('t() returns translated string for active language and falls back to English', () => {
  setLanguage('es');
  assert.equal(getLanguage(), 'es');
  assert.equal(t('leaveBtn'), 'Salir');

  setLanguage('de');
  assert.equal(getLanguage(), 'de');
  assert.equal(t('leaveBtn'), 'Verlassen');

  setLanguage('en');
  assert.equal(getLanguage(), 'en');
  assert.equal(t('leaveBtn'), 'Leave');

  // Fallback test
  assert.equal(t('nonExistentKey', 'FallbackValue'), 'FallbackValue');
});
