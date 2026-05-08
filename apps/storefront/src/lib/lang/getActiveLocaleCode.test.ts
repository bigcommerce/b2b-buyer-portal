import { getActiveLocaleCode } from './getActiveLocaleCode';

const LOCALES = [
  { code: 'fr', isDefault: true, fullPath: 'https://store.example.com/' },
  { code: 'fr-CA', isDefault: false, fullPath: 'https://store.example.com/fr-ca' },
  { code: 'en', isDefault: false, fullPath: 'https://store.example.com/en' },
];

describe('getActiveLocaleCode', () => {
  it('returns the active locale code from the URL', () => {
    expect(getActiveLocaleCode(LOCALES, 'https://store.example.com/en/orders')).toBe('en');
  });

  it('preserves region tags so callers can prefer regional bundles (fr-CA stays fr-CA)', () => {
    expect(getActiveLocaleCode(LOCALES, 'https://store.example.com/fr-ca/orders')).toBe('fr-CA');
  });

  it('returns the root-default locale (fr) for arbitrary paths under the default root', () => {
    expect(getActiveLocaleCode(LOCALES, 'https://store.example.com/my-page')).toBe('fr');
  });

  it('returns the root-default locale (fr) at the bare default root', () => {
    expect(getActiveLocaleCode(LOCALES, 'https://store.example.com/')).toBe('fr');
  });

  it('falls back to en when getActiveLocale cannot resolve any match', () => {
    expect(getActiveLocaleCode(LOCALES, 'https://other-store.example.com/')).toBe('en');
  });

  it('falls back to en when locales list is empty', () => {
    expect(getActiveLocaleCode([], 'https://store.example.com/')).toBe('en');
  });
});
