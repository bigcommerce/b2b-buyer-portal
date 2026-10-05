import { store } from '@/store';

import { getActiveDateLocale } from './getActiveDateLocale';

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

describe('getActiveDateLocale', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
    vi.restoreAllMocks();
  });

  it('returns undefined when the date localization flag is disabled', () => {
    setHref('https://store.example.com/fr');
    mockState({ 'LOCAL-3509.Translate_b2b_dates': false });

    expect(getActiveDateLocale()).toBeUndefined();
  });

  it('returns the active locale when the flag is enabled', () => {
    setHref('https://store.example.com/fr/some-page');
    mockState({ 'LOCAL-3509.Translate_b2b_dates': true });

    expect(getActiveDateLocale()).toMatchObject({ code: 'fr', isDefault: false });
  });

  it('marks the default store locale as default', () => {
    setHref('https://store.example.com/');
    mockState({ 'LOCAL-3509.Translate_b2b_dates': true });

    expect(getActiveDateLocale()).toMatchObject({ code: 'en', isDefault: true });
  });

  it('falls back to en when the flag is enabled but no locale matches the URL', () => {
    setHref('https://other-store.example.com/');
    mockState({ 'LOCAL-3509.Translate_b2b_dates': true });

    expect(getActiveDateLocale()).toEqual({ code: 'en', isDefault: true });
  });
});
