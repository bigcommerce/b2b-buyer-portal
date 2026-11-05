import { store } from '@/store';

import { getActiveDateLocale } from './getActiveDateLocale';

const FLAG = 'LOCAL-3509.Translate_b2b_dates';
const STORE_URL = 'https://store.example.com';

const buildLocale = (code: string, isDefault = false) => ({
  code,
  isDefault,
  fullPath: isDefault ? `${STORE_URL}/` : `${STORE_URL}/${code}`,
});

const mockState = (featureFlags: Record<string, boolean>, codes: string[]) =>
  vi.spyOn(store, 'getState').mockReturnValue({
    global: {
      featureFlags,
      locales: [buildLocale('en', true), ...codes.map((code) => buildLocale(code))],
    },
  } as unknown as ReturnType<typeof store.getState>);

const setHref = (href: string) => {
  Object.defineProperty(window, 'location', { value: { href }, writable: true });
};

describe('getActiveDateLocale', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
    vi.restoreAllMocks();
  });

  it('returns undefined when the date localization flag is disabled', () => {
    setHref(`${STORE_URL}/fr`);
    mockState({ [FLAG]: false }, ['fr']);

    expect(getActiveDateLocale()).toBeUndefined();
  });

  it('returns the locale code of a shipped language', () => {
    setHref(`${STORE_URL}/fr/some-page`);
    mockState({ [FLAG]: true }, ['fr']);

    expect(getActiveDateLocale()).toBe('fr');
  });

  it.each(['es-MX', 'pt-BR'])('returns the regional code %s of a shipped language', (code) => {
    setHref(`${STORE_URL}/${code}`);
    mockState({ [FLAG]: true }, [code]);

    expect(getActiveDateLocale()).toBe(code);
  });

  it.each(['en', 'en-GB'])('returns undefined for the English variant %s', (code) => {
    setHref(`${STORE_URL}/${code}`);
    mockState({ [FLAG]: true }, [code]);

    expect(getActiveDateLocale()).toBeUndefined();
  });

  it('returns undefined for a language the portal ships no translations for', () => {
    setHref(`${STORE_URL}/uk`);
    mockState({ [FLAG]: true }, ['uk']);

    expect(getActiveDateLocale()).toBeUndefined();
  });

  it('returns undefined when no storefront locale matches the URL', () => {
    setHref('https://other-store.example.com/');
    mockState({ [FLAG]: true }, ['fr']);

    expect(getActiveDateLocale()).toBeUndefined();
  });
});
