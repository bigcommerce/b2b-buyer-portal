import { buildGlobalStateWith } from 'tests/storeStateBuilders';
import { renderHookWithProviders } from 'tests/utils/hook-test-utils';

import { CART_URL } from '@/constants';

import { useLocalizedUrl } from './useLocalizedUrl';

const LOCALES = [
  { code: 'en', isDefault: true, fullPath: 'https://store.example.com/' },
  { code: 'fr-CA', isDefault: false, fullPath: 'https://store.example.com/fr-ca' },
];

describe('useLocalizedUrl', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { href: 'https://store.example.com/fr-ca/quick-order' },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
  });

  it('returns the url of the active locale when product translation is enabled', () => {
    const preloadedState = {
      global: buildGlobalStateWith({
        locales: LOCALES,
        featureFlags: { 'LOCAL-3626.B2B_product_translation': true },
      }),
    };

    const { result } = renderHookWithProviders(() => useLocalizedUrl(CART_URL), { preloadedState });

    expect(result.result.current).toBe(`https://store.example.com/fr-ca${CART_URL}`);
  });

  it('returns the unchanged url when product translation is disabled', () => {
    const preloadedState = {
      global: buildGlobalStateWith({
        locales: LOCALES,
        featureFlags: { 'LOCAL-3626.B2B_product_translation': false },
      }),
    };

    const { result } = renderHookWithProviders(() => useLocalizedUrl(CART_URL), { preloadedState });

    expect(result.result.current).toBe(CART_URL);
  });
});
