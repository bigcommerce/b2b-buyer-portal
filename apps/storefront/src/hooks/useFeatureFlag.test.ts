import { buildGlobalStateWith } from 'tests/storeStateBuilders';
import { renderHookWithProviders } from 'tests/utils/hook-test-utils';
import { it } from 'vitest';

import type { FeatureFlagKey } from '@/utils/featureFlags';

import { useFeatureFlag } from './useFeatureFlag';

const TEST_FEATURE_FLAG_KEY = 'B2B-1234.test_feature_flag' as FeatureFlagKey;

it('returns true when the requested flag is enabled', () => {
  const preloadedState = {
    global: buildGlobalStateWith({
      featureFlags: {
        [TEST_FEATURE_FLAG_KEY]: true,
      },
    }),
  };

  const { result } = renderHookWithProviders(() => useFeatureFlag(TEST_FEATURE_FLAG_KEY), {
    preloadedState,
  });
  expect(result.result.current).toBe(true);
});

it('defaults to false when the flag key is missing', () => {
  const preloadedState = {
    global: buildGlobalStateWith({
      featureFlags: {},
    }),
  };

  const { result } = renderHookWithProviders(() => useFeatureFlag(TEST_FEATURE_FLAG_KEY), {
    preloadedState,
  });
  expect(result.result.current).toBe(false);
});

it('returns false when the flag is explicitly false', () => {
  const preloadedState = {
    global: buildGlobalStateWith({
      featureFlags: {
        [TEST_FEATURE_FLAG_KEY]: false,
      },
    }),
  };

  const { result } = renderHookWithProviders(() => useFeatureFlag(TEST_FEATURE_FLAG_KEY), {
    preloadedState,
  });
  expect(result.result.current).toBe(false);
});
