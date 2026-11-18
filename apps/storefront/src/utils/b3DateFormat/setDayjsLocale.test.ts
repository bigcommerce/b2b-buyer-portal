import dayjs from 'dayjs';

import { SUPPORT_LANGUAGE } from '@/constants';

import setDayjsLocale, { getDayjsLocale } from './setDayjsLocale';

describe('setDayjsLocale', () => {
  afterEach(() => {
    dayjs.locale('en');
  });

  it.each(SUPPORT_LANGUAGE)(
    'switches the global dayjs locale to the supported language %s',
    (language) => {
      expect(setDayjsLocale(language)).toBe(language);
      expect(dayjs.locale()).toBe(language);
    },
  );

  it.each([
    ['es-MX', 'es'],
    ['pt-BR', 'pt'],
    ['fr-CA', 'fr'],
    ['en-GB', 'en'],
  ])('resolves the regional code %s to its base language %s', (code, expected) => {
    expect(setDayjsLocale(code)).toBe(expected);
    expect(dayjs.locale()).toBe(expected);
  });

  it('is case-insensitive', () => {
    expect(setDayjsLocale('DE')).toBe('de');
    expect(dayjs.locale()).toBe('de');
  });

  it('maps Norwegian no to the dayjs nb locale', () => {
    expect(setDayjsLocale('no')).toBe('nb');
    expect(dayjs.locale()).toBe('nb');
  });

  it.each(['ko', 'xx-YY'])('falls back to English for the unsupported language %s', (code) => {
    dayjs.locale('fr');

    expect(setDayjsLocale(code)).toBe('en');
    expect(dayjs.locale()).toBe('en');
  });

  it('falls back to English for an empty locale key', () => {
    dayjs.locale('fr');

    expect(setDayjsLocale('')).toBe('en');
    expect(dayjs.locale()).toBe('en');
  });
});

describe('getDayjsLocale', () => {
  afterEach(() => {
    dayjs.locale('en');
  });

  it('returns English by default', () => {
    expect(getDayjsLocale()).toBe('en');
  });

  it('returns the language the global dayjs locale was set to', () => {
    setDayjsLocale('ja');

    expect(getDayjsLocale()).toBe('ja');
  });

  it('returns the base language when the global dayjs locale is regional', () => {
    dayjs.locale('es-mx');

    expect(getDayjsLocale()).toBe('es');
  });
});
