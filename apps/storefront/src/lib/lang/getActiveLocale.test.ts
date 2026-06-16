import { getActiveLocale } from './getActiveLocale';

const LOCALES = [
  { code: 'fr', isDefault: true, fullPath: 'https://store.example.com/' },
  { code: 'fr-CA', isDefault: false, fullPath: 'https://store.example.com/fr-ca' },
  { code: 'en', isDefault: false, fullPath: 'https://store.example.com/en' },
];

const setHref = (href: string) => {
  Object.defineProperty(window, 'location', {
    value: { href },
    writable: true,
  });
};

describe('getActiveLocale', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
  });

  it('matches the longest fullPath prefix', () => {
    setHref('https://store.example.com/fr-ca/orders');
    expect(getActiveLocale(LOCALES)?.code).toBe('fr-CA');
  });

  it('matches the root locale at the bare default root', () => {
    setHref('https://store.example.com/');
    expect(getActiveLocale(LOCALES)?.code).toBe('fr');
  });

  it('does not match a partial-segment prefix (/english should not match /en); falls through to the default', () => {
    setHref('https://store.example.com/english');
    expect(getActiveLocale(LOCALES)?.code).toBe('fr');
  });

  it('matches the default language for arbitrary sub-paths under the default root', () => {
    setHref('https://store.example.com/my-page');
    expect(getActiveLocale(LOCALES)?.code).toBe('fr');
  });

  it('returns undefined when the URL host does not match any fullPath', () => {
    setHref('https://other-store.example.com/');
    expect(getActiveLocale(LOCALES)).toBeUndefined();
  });

  it('does not mutate the input locales array', () => {
    setHref('https://store.example.com/fr-ca/orders');
    const input = [...LOCALES];
    const snapshot = [...input];
    getActiveLocale(input);
    expect(input).toEqual(snapshot);
  });
});
