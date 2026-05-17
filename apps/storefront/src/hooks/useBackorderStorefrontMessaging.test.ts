import { buildGlobalStateWith } from 'tests/storeStateBuilders';
import { renderHookWithProviders } from 'tests/utils/hook-test-utils';
import { describe, expect, it } from 'vitest';

import {
  BACKORDER_STOREFRONT_MESSAGING_FEATURE_FLAG,
  useBackorderStorefrontMessaging,
} from './useBackorderStorefrontMessaging';

describe('useBackorderStorefrontMessaging', () => {
  it('combines store backorder, messaging flag, and display settings', () => {
    const { result } = renderHookWithProviders(() => useBackorderStorefrontMessaging(), {
      preloadedState: {
        global: buildGlobalStateWith({
          backorderEnabled: true,
          featureFlags: {
            [BACKORDER_STOREFRONT_MESSAGING_FEATURE_FLAG]: true,
          },
          backorderDisplaySettings: {
            showQuantityOnBackorder: true,
            showQuantityOnHand: false,
            showBackorderMessage: false,
            showDefaultShippingExpectationPrompt: false,
            defaultShippingExpectationPrompt: '',
          },
        }),
      },
    });

    expect(result.result.current.isBackorderEnabled).toBe(true);
    expect(result.result.current.isBackorderMessagingEnabled).toBe(true);
    expect(result.result.current.isBackorderMessagingContextEnabled).toBe(true);
    expect(result.result.current.hasAnyBackorderDisplay).toBe(true);
  });

  it('sets isBackorderMessagingContextEnabled false when the feature flag is off', () => {
    const { result } = renderHookWithProviders(() => useBackorderStorefrontMessaging(), {
      preloadedState: {
        global: buildGlobalStateWith({
          backorderEnabled: true,
          featureFlags: {
            [BACKORDER_STOREFRONT_MESSAGING_FEATURE_FLAG]: false,
          },
        }),
      },
    });

    expect(result.result.current.isBackorderMessagingContextEnabled).toBe(false);
  });

  it('sets hasAnyBackorderDisplay false when all display toggles are off', () => {
    const { result } = renderHookWithProviders(() => useBackorderStorefrontMessaging(), {
      preloadedState: {
        global: buildGlobalStateWith({
          backorderEnabled: true,
          featureFlags: {
            [BACKORDER_STOREFRONT_MESSAGING_FEATURE_FLAG]: true,
          },
          backorderDisplaySettings: {
            showQuantityOnBackorder: false,
            showQuantityOnHand: false,
            showBackorderMessage: false,
            showDefaultShippingExpectationPrompt: false,
            defaultShippingExpectationPrompt: '',
          },
        }),
      },
    });

    expect(result.result.current.hasAnyBackorderDisplay).toBe(false);
  });
});
