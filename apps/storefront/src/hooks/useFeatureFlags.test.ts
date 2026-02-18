import { buildGlobalStateWith } from 'tests/storeStateBuilders';
import { renderHookWithProviders } from 'tests/utils/hook-test-utils';
import { it } from 'vitest';

import { useFeatureFlags } from './useFeatureFlags';

it('should return feature flags from global state', () => {
  const preloadedState = {
    global: buildGlobalStateWith({
      featureFlags: {
        'B2B-3817.disable_masquerading_cleanup_on_login': true,
      },
    }),
  };

  const { result } = renderHookWithProviders(() => useFeatureFlags(), { preloadedState });
  expect(result.result.current).toEqual({
    'B2B-3817.disable_masquerading_cleanup_on_login': true,
  });
});
