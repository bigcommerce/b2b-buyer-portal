import { buildGlobalStateWith } from 'tests/storeStateBuilders';
import { renderHookWithProviders } from 'tests/utils/hook-test-utils';
import { describe, expect, it } from 'vitest';

import { useBackorderStorefrontMessaging } from './useBackorderStorefrontMessaging';

describe('useBackorderStorefrontMessaging', () => {
  it('combines store backorder state and display settings', () => {
    const { result } = renderHookWithProviders(() => useBackorderStorefrontMessaging(), {
      preloadedState: {
        global: buildGlobalStateWith({
          backorderEnabled: true,
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
    expect(result.result.current.hasAnyBackorderDisplay).toBe(true);
  });

  it('sets isBackorderEnabled false when the store backorder state is off', () => {
    const { result } = renderHookWithProviders(() => useBackorderStorefrontMessaging(), {
      preloadedState: {
        global: buildGlobalStateWith({
          backorderEnabled: false,
        }),
      },
    });

    expect(result.result.current.isBackorderEnabled).toBe(false);
  });

  it('sets hasAnyBackorderDisplay false when all display toggles are off', () => {
    const { result } = renderHookWithProviders(() => useBackorderStorefrontMessaging(), {
      preloadedState: {
        global: buildGlobalStateWith({
          backorderEnabled: true,
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
