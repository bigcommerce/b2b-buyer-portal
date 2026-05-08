import { getActiveLocale, getActiveLocaleCode } from './getActiveLocaleCode';

const LOCALES = [
  { code: 'en', isDefault: true, fullPath: 'https://store.example.com/' },
  { code: 'fr', isDefault: false, fullPath: 'https://store.example.com/fr' },
  { code: 'fr-CA', isDefault: false, fullPath: 'https://store.example.com/fr-ca' },
];

describe('getActiveLocale', () => {
  it('matches the longest fullPath prefix', () => {
    expect(getActiveLocale(LOCALES, 'https://store.example.com/fr-ca/orders')?.code).toBe('fr-CA');
  });

  it('does not match when the next character is part of another path segment', () => {
    expect(getActiveLocale(LOCALES, 'https://store.example.com/frozen')).toBeUndefined();
  });

  it('matches when fullPath ends exactly at the URL', () => {
    expect(getActiveLocale(LOCALES, 'https://store.example.com/fr')?.code).toBe('fr');
  });
});

describe('getActiveLocaleCode', () => {
  it('returns the active locale code from the URL', () => {
    expect(getActiveLocaleCode(LOCALES, 'https://store.example.com/fr/orders')).toBe('fr');
  });

  it('preserves region tags so callers can prefer regional bundles (fr-CA stays fr-CA)', () => {
    expect(getActiveLocaleCode(LOCALES, 'https://store.example.com/fr-ca/orders')).toBe('fr-CA');
  });

  it('falls back to the default locale when no URL match', () => {
    expect(getActiveLocaleCode(LOCALES, 'https://other-store.example.com/')).toBe('en');
  });

  it('falls back to en when locales list is empty', () => {
    expect(getActiveLocaleCode([], 'https://store.example.com/')).toBe('en');
  });

  it('falls back to en when there is no default and no URL match', () => {
    const noDefault = [{ code: 'fr', isDefault: false, fullPath: 'https://store.example.com/fr' }];
    expect(getActiveLocaleCode(noDefault, 'https://elsewhere.example.com/')).toBe('en');
  });
});
