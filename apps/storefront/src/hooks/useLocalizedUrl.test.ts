import { buildGlobalStateWith } from 'tests/storeStateBuilders';
import { renderHookWithProviders } from 'tests/utils/hook-test-utils';

import { CART_URL } from '@/constants';
import { setupStore } from '@/store';
import { setLocales } from '@/store/slices/global';

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

  it('resolves the url of the active locale when product translation is enabled', () => {
    const preloadedState = {
      global: buildGlobalStateWith({
        locales: LOCALES,
        featureFlags: { 'LOCAL-3626.B2B_product_translation': true },
      }),
    };

    const { result } = renderHookWithProviders(() => useLocalizedUrl(), {
      preloadedState,
    });

    expect(result.result.current.getCartUrl()).toBe(`https://store.example.com/fr-ca${CART_URL}`);
  });

  it('resolves the unchanged url when product translation is disabled', () => {
    const preloadedState = {
      global: buildGlobalStateWith({
        locales: LOCALES,
        featureFlags: { 'LOCAL-3626.B2B_product_translation': false },
      }),
    };

    const { result } = renderHookWithProviders(() => useLocalizedUrl(), {
      preloadedState,
    });

    expect(result.result.current.getCartUrl()).toBe(CART_URL);
  });

  it('uses locales that finish loading after the hook was rendered', () => {
    const store = setupStore({
      global: buildGlobalStateWith({
        locales: [],
        featureFlags: { 'LOCAL-3626.B2B_product_translation': true },
      }),
    });
    const { result } = renderHookWithProviders(() => useLocalizedUrl(), { store });
    const { getCartUrl } = result.result.current;

    expect(getCartUrl()).toBe(CART_URL);

    store.dispatch(setLocales(LOCALES));

    expect(getCartUrl()).toBe(`https://store.example.com/fr-ca${CART_URL}`);
  });
});
