import { it } from 'vitest';
import { buildGlobalStateWith } from 'tests/storeStateBuilders';
import { renderHookWithProviders } from 'tests/utils/hook-test-utils';

import { useFeatureFlags } from './useFeatureFlags';

it('should return feature flags from global state', () => {
  const preloadedState = {
    global: buildGlobalStateWith({
      featureFlags: {
        'B2B-3318.move_stock_and_backorder_validation_to_backend': true,
      },
    }),
  };

  const { result } = renderHookWithProviders(() => useFeatureFlags(), { preloadedState });

  expect(result.result.current).toEqual({
    'B2B-3318.move_stock_and_backorder_validation_to_backend': true,
  });
});
