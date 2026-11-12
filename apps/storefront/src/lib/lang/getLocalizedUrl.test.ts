import { getLocalizedUrl } from './getLocalizedUrl';

const LOCALES = [
  { code: 'en', isDefault: true, fullPath: 'https://store.example.com/' },
  { code: 'fr-CA', isDefault: false, fullPath: 'https://store.example.com/fr-ca' },
  { code: 'de', isDefault: false, fullPath: 'https://store.example.com/de/' },
];

const setHref = (href: string) => {
  Object.defineProperty(window, 'location', {
    value: { href },
    writable: true,
  });
};

describe('getLocalizedUrl', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
  });

  it('prefixes the url with the active non-default locale', () => {
    setHref('https://store.example.com/fr-ca/orders');

    expect(getLocalizedUrl('/cart.php', LOCALES)).toBe('https://store.example.com/fr-ca/cart.php');
  });

  it('handles a locale path that ends with a slash', () => {
    setHref('https://store.example.com/de/quick-order');

    expect(getLocalizedUrl('/cart.php', LOCALES)).toBe('https://store.example.com/de/cart.php');
  });

  it('does not double the slash for a default locale on the store root', () => {
    setHref('https://store.example.com/orders');

    expect(getLocalizedUrl('/cart.php', LOCALES)).toBe('https://store.example.com/cart.php');
  });

  it('keeps the url unchanged when no locales are configured', () => {
    setHref('https://store.example.com/fr-ca/orders');

    expect(getLocalizedUrl('/cart.php', [])).toBe('/cart.php');
  });

  it('keeps an absolute url unchanged', () => {
    setHref('https://store.example.com/fr-ca/orders');

    expect(getLocalizedUrl('https://store.example.com/cart.php', LOCALES)).toBe(
      'https://store.example.com/cart.php',
    );
  });

  it('keeps a protocol-relative url unchanged', () => {
    setHref('https://store.example.com/fr-ca/orders');

    expect(getLocalizedUrl('//cart.example.com/cart', LOCALES)).toBe('//cart.example.com/cart');
  });

  it('joins a relative path without a leading slash with a single slash', () => {
    setHref('https://store.example.com/fr-ca/orders');

    expect(getLocalizedUrl('cart.php', LOCALES)).toBe('https://store.example.com/fr-ca/cart.php');
  });

  it('prefixes the url when the default locale lives in a subdirectory', () => {
    setHref('https://store.example.com/de/orders');

    expect(
      getLocalizedUrl('/cart.php', [
        { code: 'de', isDefault: true, fullPath: 'https://store.example.com/de' },
        { code: 'en', isDefault: false, fullPath: 'https://store.example.com/en' },
      ]),
    ).toBe('https://store.example.com/de/cart.php');
  });
});
