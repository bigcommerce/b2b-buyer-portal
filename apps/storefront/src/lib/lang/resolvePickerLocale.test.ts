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
    ['nb-NO', 'nb'],
    ['DE', 'de'],
    ['FR-CA', 'fr'],
    ['da', 'da'],
    ['en-GB', 'en'],
    ['fr-CA', 'fr'],
    ['de-AT', 'de'],
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

  it.each(['xx', 'uk'])(
    'falls back to the store default locale for the unsupported active locale %s',
    (code) => {
      setHref(`${STORE_URL}/${code}`);

      expect(
        resolvePickerLocale({
          isEnabled: true,
          locales: buildLocales('de', [code]),
          fallbackLocale: 'fr',
        }),
      ).toBe('de');
    },
  );

  it('falls back to a picker-only store default for an unsupported active locale', () => {
    setHref(`${STORE_URL}/xx`);

    expect(
      resolvePickerLocale({
        isEnabled: true,
        locales: buildLocales('pt-BR', ['xx']),
        fallbackLocale: 'en',
      }),
    ).toBe('pt-br');
  });

  it('returns the fallback locale when the store default locale is unsupported too', () => {
    setHref(`${STORE_URL}/xx`);

    expect(
      resolvePickerLocale({
        isEnabled: true,
        locales: buildLocales('uk', ['xx']),
        fallbackLocale: 'fr',
      }),
    ).toBe('fr');
  });

  it('returns the English fallback for a Chinese locale on an English-default store', () => {
    setHref(`${STORE_URL}/zh-CN`);

    expect(
      resolvePickerLocale({
        isEnabled: true,
        locales: buildLocales('en', ['zh-CN']),
        fallbackLocale: 'en',
      }),
    ).toBe('en');
  });

  it('keeps the Chinese picker on a Chinese-default store', () => {
    setHref(`${STORE_URL}/zh`);

    expect(
      resolvePickerLocale({
        isEnabled: true,
        locales: buildLocales('zh', ['en']),
        fallbackLocale: 'zh',
      }),
    ).toBe('zh');
  });

  it('returns the fallback locale when no active locale can be resolved', () => {
    setHref(`${STORE_URL}/fr`);

    expect(resolvePickerLocale({ isEnabled: true, locales: [], fallbackLocale: 'nl' })).toBe('nl');
  });
});
