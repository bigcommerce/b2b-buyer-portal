import {
  getMultiLanguageEnabledCache,
  setMultiLanguageEnabledCache,
} from './multiLanguageFlagCache';

describe('multi-language feature flag cache', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to false when nothing has been cached yet', () => {
    expect(getMultiLanguageEnabledCache()).toBe(false);
  });

  it('round-trips the cached value', () => {
    setMultiLanguageEnabledCache(true);
    expect(getMultiLanguageEnabledCache()).toBe(true);

    setMultiLanguageEnabledCache(false);
    expect(getMultiLanguageEnabledCache()).toBe(false);
  });

  it('resolves to false when local storage is unavailable', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    expect(getMultiLanguageEnabledCache()).toBe(false);

    getItem.mockRestore();
  });
});
