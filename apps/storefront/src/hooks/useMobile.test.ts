import { act } from '@testing-library/react';
import { buildGlobalStateWith } from 'tests/storeStateBuilders';
import { renderHookWithProviders } from 'tests/utils/hook-test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import { useMobile } from './useMobile';

const MOBILE_BREAKPOINT_PX = 768;

// jsdom reports `document.body.clientWidth` as 0, so override it per-test to
// drive the hook's breakpoint logic, then restore jsdom's default afterwards.
const setClientWidth = (width: number) => {
  Object.defineProperty(document.body, 'clientWidth', {
    configurable: true,
    value: width,
  });
};

describe('useMobile', () => {
  afterEach(() => {
    Reflect.deleteProperty(document.body, 'clientWidth');
  });

  describe('when B2B-5309.dedupe_storefront_config_fetch_calls is on', () => {
    const flagOn = {
      global: buildGlobalStateWith({
        featureFlags: { 'B2B-5309.dedupe_storefront_config_fetch_calls': true },
      }),
    };

    it('reports mobile when the viewport is at the breakpoint', () => {
      setClientWidth(MOBILE_BREAKPOINT_PX);

      const { result } = renderHookWithProviders(() => useMobile(), { preloadedState: flagOn });

      expect(result.result.current[0]).toBe(true);
    });

    it('reports non-mobile when the viewport is above the breakpoint', () => {
      setClientWidth(MOBILE_BREAKPOINT_PX + 1);

      const { result } = renderHookWithProviders(() => useMobile(), { preloadedState: flagOn });

      expect(result.result.current[0]).toBe(false);
    });

    it('updates the mobile state when the window is resized', () => {
      setClientWidth(MOBILE_BREAKPOINT_PX + 100);

      const { result } = renderHookWithProviders(() => useMobile(), { preloadedState: flagOn });

      expect(result.result.current[0]).toBe(false);

      act(() => {
        setClientWidth(MOBILE_BREAKPOINT_PX);
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.result.current[0]).toBe(true);
    });
  });

  describe('when B2B-5309.dedupe_storefront_config_fetch_calls is off', () => {
    const flagOff = {
      global: buildGlobalStateWith({
        featureFlags: { 'B2B-5309.dedupe_storefront_config_fetch_calls': false },
      }),
    };

    it('resolves the mobile state from the viewport after the mount effect runs', () => {
      setClientWidth(MOBILE_BREAKPOINT_PX);

      const { result } = renderHookWithProviders(() => useMobile(), { preloadedState: flagOff });

      // With the flag off the hook initialises to `false` and relies on the
      // mount effect calling resize() to reflect the actual viewport width.
      expect(result.result.current[0]).toBe(true);
    });
  });
});
