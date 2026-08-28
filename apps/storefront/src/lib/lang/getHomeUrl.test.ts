import { getHomeUrl } from './getHomeUrl';

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

describe('getHomeUrl', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
  });

  it('returns the fullPath of the active locale', () => {
    setHref('https://store.example.com/fr-ca/orders');
    expect(getHomeUrl(LOCALES)).toBe('https://store.example.com/fr-ca');
  });

  it('falls back to the default locale when no locale matches the current URL', () => {
    setHref('https://other-store.example.com/orders');
    expect(getHomeUrl(LOCALES)).toBe('https://store.example.com/');
  });

  it('returns "/" when there are no locales', () => {
    setHref('https://store.example.com/orders');
    expect(getHomeUrl([])).toBe('/');
  });

  it('returns "/" when neither an active nor a default locale is available', () => {
    setHref('https://other-store.example.com/orders');
    expect(
      getHomeUrl([{ code: 'en', isDefault: false, fullPath: 'https://store.example.com/en' }]),
    ).toBe('/');
  });
});
