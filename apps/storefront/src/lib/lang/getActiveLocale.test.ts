import { getActiveLocale } from './getActiveLocale';

const LOCALES = [
  { code: 'fr', isDefault: true, fullPath: 'https://store.example.com/' },
  { code: 'fr-CA', isDefault: false, fullPath: 'https://store.example.com/fr-ca' },
  { code: 'en', isDefault: false, fullPath: 'https://store.example.com/en' },
];

describe('getActiveLocale', () => {
  it('matches the longest fullPath prefix', () => {
    expect(getActiveLocale(LOCALES, 'https://store.example.com/fr-ca/orders')?.code).toBe('fr-CA');
  });

  it('matches when fullPath ends exactly at the URL', () => {
    expect(getActiveLocale(LOCALES, 'https://store.example.com/en')?.code).toBe('en');
  });

  it('does not match a partial-segment prefix (e.g. /english should not match /en)', () => {
    expect(getActiveLocale(LOCALES, 'https://store.example.com/english')?.code).toBe('fr');
  });

  it('matches the root-prefix default for any path under the default root', () => {
    expect(getActiveLocale(LOCALES, 'https://store.example.com/my-page')?.code).toBe('fr');
  });

  it('matches the root-prefix default at the bare default root', () => {
    expect(getActiveLocale(LOCALES, 'https://store.example.com/')?.code).toBe('fr');
  });

  it('returns undefined when no fullPath matches the URL', () => {
    expect(getActiveLocale(LOCALES, 'https://other-store.example.com/')).toBeUndefined();
  });
});
