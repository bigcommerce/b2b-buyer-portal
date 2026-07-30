import { buildGlobalStateWith } from 'tests/storeStateBuilders';
import { renderHookWithProviders } from 'tests/utils/hook-test-utils';

import type { FeatureFlagKey } from '@/utils/featureFlags';

import {
  shouldApplyFeatureFlagOnBigCommerce,
  useFeatureFlag,
  useShouldApplyFeatureFlagOnBigCommerce,
} from './useFeatureFlag';

const platformMock = vi.hoisted(() => ({ isBigCommercePlatform: vi.fn(() => true) }));

vi.mock('@/utils/basicConfig', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/basicConfig')>()),
  isBigCommercePlatform: platformMock.isBigCommercePlatform,
}));

const TEST_FEATURE_FLAG_KEY = 'B2B-1234.test_feature_flag' as FeatureFlagKey;

describe('useFeatureFlag', () => {
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
});

describe('shouldApplyFeatureFlagOnBigCommerce', () => {
  beforeEach(() => {
    platformMock.isBigCommercePlatform.mockReturnValue(true);
  });

  it('returns true when the flag is on and the platform is Stencil', () => {
    expect(
      shouldApplyFeatureFlagOnBigCommerce({ [TEST_FEATURE_FLAG_KEY]: true }, TEST_FEATURE_FLAG_KEY),
    ).toBe(true);
  });

  it('returns false when the platform is not bigcommerce even when the flag is on', () => {
    platformMock.isBigCommercePlatform.mockReturnValue(false);

    expect(
      shouldApplyFeatureFlagOnBigCommerce({ [TEST_FEATURE_FLAG_KEY]: true }, TEST_FEATURE_FLAG_KEY),
    ).toBe(false);
  });
});

describe('useShouldApplyFeatureFlagOnBigCommerce', () => {
  beforeEach(() => {
    platformMock.isBigCommercePlatform.mockReturnValue(true);
  });

  it('returns true when the flag is on and the platform is Stencil', () => {
    const { result } = renderHookWithProviders(
      () => useShouldApplyFeatureFlagOnBigCommerce(TEST_FEATURE_FLAG_KEY),
      {
        preloadedState: {
          global: buildGlobalStateWith({
            featureFlags: { [TEST_FEATURE_FLAG_KEY]: true },
          }),
        },
      },
    );

    expect(result.result.current).toBe(true);
  });

  it('returns false when the platform is not bigcommerce even when the flag is on', () => {
    platformMock.isBigCommercePlatform.mockReturnValue(false);

    const { result } = renderHookWithProviders(
      () => useShouldApplyFeatureFlagOnBigCommerce(TEST_FEATURE_FLAG_KEY),
      {
        preloadedState: {
          global: buildGlobalStateWith({
            featureFlags: { [TEST_FEATURE_FLAG_KEY]: true },
          }),
        },
      },
    );

    expect(result.result.current).toBe(false);
  });
});
