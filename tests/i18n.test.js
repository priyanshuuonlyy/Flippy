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
    'faqH2',
    'navCompare',
    'compareH2',
    'btnBlock',
    'appearanceLabel',
    'onboardingTitle',
    'onboardBtnStart'
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

test('every language dictionary is complete, distinct, and verified native', () => {
  const enKeys = Object.keys(TRANSLATIONS.en).sort();
  assert.equal(enKeys.length >= 170, true);

  for (const [code, dict] of Object.entries(TRANSLATIONS)) {
    const keys = Object.keys(dict).sort();
    assert.deepEqual(keys, enKeys, `Language ${code} must have the exact same keys as English`);
  }

  // Verify English is pure English
  assert.equal(TRANSLATIONS.en.onboardStep1Title, 'Choose your language');
  assert.equal(TRANSLATIONS.en.btnBlock, 'Block');
  assert.equal(TRANSLATIONS.en.appearanceNatural, 'Natural · Original camera');
  assert.equal(TRANSLATIONS.en.compareH2, 'Flippy vs OmeTV vs Omegle — The Modern Alternative');

  // Verify German is pure German
  assert.equal(TRANSLATIONS.de.onboardStep1Title, 'Wähle deine Sprache');
  assert.equal(TRANSLATIONS.de.btnBlock, 'Blockieren');
  assert.equal(TRANSLATIONS.de.compareH2, 'Flippy vs OmeTV vs Omegle — Die Moderne Alternative');

  // Verify Spanish is pure Spanish
  assert.equal(TRANSLATIONS.es.onboardStep1Title, 'Elige tu idioma');
  assert.equal(TRANSLATIONS.es.btnBlock, 'Bloquear');
  assert.equal(TRANSLATIONS.es.compareH2, 'Flippy vs OmeTV vs Omegle — La Alternativa Moderna');

  // Verify Portuguese is pure Portuguese
  assert.equal(TRANSLATIONS.pt.onboardStep1Title, 'Escolha seu idioma');
  assert.equal(TRANSLATIONS.pt.btnBlock, 'Bloquear');
  assert.equal(TRANSLATIONS.pt.compareH2, 'Flippy vs OmeTV vs Omegle — A Alternativa Moderna');

  // Verify French is pure French
  assert.equal(TRANSLATIONS.fr.onboardStep1Title, 'Choisissez votre langue');
  assert.equal(TRANSLATIONS.fr.btnBlock, 'Bloquer');
  assert.equal(TRANSLATIONS.fr.compareH2, 'Flippy vs OmeTV vs Omegle — L’Alternative Moderne');

  // Verify Turkish is pure Turkish
  assert.equal(TRANSLATIONS.tr.onboardStep1Title, 'Dilinizi seçin');
  assert.equal(TRANSLATIONS.tr.btnBlock, 'Engelle');
  assert.equal(TRANSLATIONS.tr.compareH2, 'Flippy vs OmeTV vs Omegle — Modern Alternatif');
});
