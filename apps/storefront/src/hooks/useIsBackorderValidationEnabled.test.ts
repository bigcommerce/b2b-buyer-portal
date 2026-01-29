import { buildGlobalStateWith } from 'tests/storeStateBuilders';
import { renderHookWithProviders } from 'tests/utils/hook-test-utils';
import { describe, expect, it } from 'vitest';

import { useIsBackorderValidationEnabled } from './useIsBackorderValidationEnabled';

describe('useIsBackorderValidationEnabled', () => {
  describe('when feature flag is enabled but backorderEnabled is false', () => {
    it('returns false', () => {
      const { result } = renderHookWithProviders(() => useIsBackorderValidationEnabled(), {
        preloadedState: {
          global: buildGlobalStateWith({
            backorderEnabled: false,
            featureFlags: {
              'B2B-3318.move_stock_and_backorder_validation_to_backend': true,
            },
          }),
        },
      });

      expect(result.result.current).toBe(false);
    });
  });

  describe('when feature flag is disabled but backorderEnabled is true', () => {
    it('returns false', () => {
      const { result } = renderHookWithProviders(() => useIsBackorderValidationEnabled(), {
        preloadedState: {
          global: buildGlobalStateWith({
            backorderEnabled: true,
            featureFlags: {
              'B2B-3318.move_stock_and_backorder_validation_to_backend': false,
            },
          }),
        },
      });

      expect(result.result.current).toBe(false);
    });
  });

  describe('when both feature flag and backorderEnabled are true', () => {
    it('returns true', () => {
      const { result } = renderHookWithProviders(() => useIsBackorderValidationEnabled(), {
        preloadedState: {
          global: buildGlobalStateWith({
            backorderEnabled: true,
            featureFlags: {
              'B2B-3318.move_stock_and_backorder_validation_to_backend': true,
            },
          }),
        },
      });

      expect(result.result.current).toBe(true);
    });
  });
});
