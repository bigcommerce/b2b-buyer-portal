import { buildGlobalStateWith } from 'tests/storeStateBuilders';
import { renderHookWithProviders } from 'tests/utils/hook-test-utils';
import { describe, expect, it } from 'vitest';

import { useIsBackorderEnabled } from './useIsBackorderEnabled';

describe('useIsBackorderEnabled', () => {
  it('returns false when backorderEnabled is false', () => {
    const { result } = renderHookWithProviders(() => useIsBackorderEnabled(), {
      preloadedState: {
        global: buildGlobalStateWith({ backorderEnabled: false }),
      },
    });

    expect(result.result.current).toBe(false);
  });

  it('returns true when backorderEnabled is true', () => {
    const { result } = renderHookWithProviders(() => useIsBackorderEnabled(), {
      preloadedState: {
        global: buildGlobalStateWith({ backorderEnabled: true }),
      },
    });

    expect(result.result.current).toBe(true);
  });
});
