import {
  isPreventPrematureOrdersRedirectCached,
  setPreventPrematureOrdersRedirectEnabled,
} from './initFlowRolloutCache';

describe('init-flow rollout feature flag cache', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to false when nothing has been cached yet', () => {
    expect(isPreventPrematureOrdersRedirectCached()).toBe(false);
  });

  it('round-trips the cached value', () => {
    setPreventPrematureOrdersRedirectEnabled(true);
    expect(isPreventPrematureOrdersRedirectCached()).toBe(true);

    setPreventPrematureOrdersRedirectEnabled(false);
    expect(isPreventPrematureOrdersRedirectCached()).toBe(false);
  });

  it('resolves to false when local storage is unavailable', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    expect(isPreventPrematureOrdersRedirectCached()).toBe(false);

    getItem.mockRestore();
  });

  it('does not throw when local storage write fails', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    expect(() => setPreventPrematureOrdersRedirectEnabled(true)).not.toThrow();

    setItem.mockRestore();
  });
});
