import { faker } from '@faker-js/faker';

import { resolvePickerLocale } from './resolvePickerLocale';

const STORE_URL = faker.internet.url({ appendSlash: false });

const buildLocale = (code: string, isDefault = false) => ({
  code,
  isDefault,
  fullPath: isDefault ? `${STORE_URL}/` : `${STORE_URL}/${code}`,
});

const buildLocales = (defaultCode: string, codes: string[]) => [
  buildLocale(defaultCode, true),
  ...codes.map((code) => buildLocale(code)),
];

const setHref = (href: string) => {
  Object.defineProperty(window, 'location', { value: { href }, writable: true });
};

describe('resolvePickerLocale', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
  });

  it('returns the fallback locale when the flag is off', () => {
    setHref(`${STORE_URL}/fr`);

    expect(
      resolvePickerLocale({
        isEnabled: false,
        locales: buildLocales('en', ['fr']),
        fallbackLocale: 'en',
      }),
    ).toBe('en');
  });

  it.each([
    ['fr', 'fr'],
    ['de', 'de'],
    ['pt-BR', 'pt-br'],
    ['es-MX', 'es-mx'],
    ['es-AR', 'es'],
    ['pt', 'pt'],
    ['no', 'nb'],
    ['da', 'da'],
  ])('maps the active storefront locale %s to the dayjs locale %s', (code, expected) => {
    setHref(`${STORE_URL}/${code}/products`);

    expect(
      resolvePickerLocale({
        isEnabled: true,
        locales: buildLocales('en', [code]),
        fallbackLocale: 'en',
      }),
    ).toBe(expected);
  });

  it('returns English when the active locale is English on a store with another default', () => {
    setHref(`${STORE_URL}/en`);

    expect(
      resolvePickerLocale({
        isEnabled: true,
        locales: buildLocales('fr', ['en']),
        fallbackLocale: 'fr',
      }),
    ).toBe('en');
  });

  it('returns English for a locale without a translation bundle', () => {
    setHref(`${STORE_URL}/xx`);

    expect(
      resolvePickerLocale({
        isEnabled: true,
        locales: buildLocales('en', ['xx']),
        fallbackLocale: 'de',
      }),
    ).toBe('en');
  });

  it('returns the fallback locale when no active locale can be resolved', () => {
    setHref(`${STORE_URL}/fr`);

    expect(resolvePickerLocale({ isEnabled: true, locales: [], fallbackLocale: 'nl' })).toBe('nl');
  });
});
