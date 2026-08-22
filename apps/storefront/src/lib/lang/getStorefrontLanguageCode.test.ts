import { store } from '@/store';

import { getStorefrontLanguageCode } from './getStorefrontLanguageCode';

const LOCALES = [
  { code: 'en', isDefault: true, fullPath: 'https://store.example.com/' },
  { code: 'fr', isDefault: false, fullPath: 'https://store.example.com/fr' },
];

const mockState = (featureFlags: Record<string, boolean>, locales = LOCALES) =>
  vi
    .spyOn(store, 'getState')
    .mockReturnValue({ global: { featureFlags, locales } } as unknown as ReturnType<
      typeof store.getState
    >);

const setHref = (href: string) => {
  Object.defineProperty(window, 'location', { value: { href }, writable: true });
};

describe('getStorefrontLanguageCode', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
    vi.restoreAllMocks();
  });

  it('returns undefined when the multi-language feature flag is disabled', () => {
    setHref('https://store.example.com/fr');
    mockState({ 'LOCAL-3191.B2B_multi_language': false });

    expect(getStorefrontLanguageCode()).toBeUndefined();
  });

  it('returns the active locale code when the flag is enabled and the URL matches a locale', () => {
    setHref('https://store.example.com/fr/some-page');
    mockState({ 'LOCAL-3191.B2B_multi_language': true });

    expect(getStorefrontLanguageCode()).toBe('fr');
  });

  it('returns undefined when the flag is enabled but no locale matches the URL', () => {
    setHref('https://other-store.example.com/');
    mockState({ 'LOCAL-3191.B2B_multi_language': true });

    expect(getStorefrontLanguageCode()).toBeUndefined();
  });
});
