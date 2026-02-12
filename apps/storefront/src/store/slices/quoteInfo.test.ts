import { getStoredState } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import sessionStorage from 'redux-persist/lib/storage/session';

import { persistConfig as quoteInfoPersistConfig } from './quoteInfo';

vi.mock('redux-persist', async () => {
  const actual = await vi.importActual('redux-persist');
  return {
    ...actual,
    getStoredState: vi.fn(),
  };
});

describe('Redux Persist Migration: Local to Session', () => {
  const mockConfig = { key: 'quoteInfo', storage: sessionStorage };
  const mockState = {
    draftQuoteList: [{ node: { id: 'sdfsdfas' } }],
    draftQuoteInfo: { userId: 4 },
    quoteDetailToCheckoutUrl: '',
    _persist: { version: -1, rehydrated: true },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return session state if it exists', async () => {
    // Scenario: Session already has data (migration already happened)
    vi.mocked(getStoredState).mockResolvedValueOnce(mockState);

    const result = await quoteInfoPersistConfig.getStoredState!(mockConfig);

    expect(result).toEqual(mockState);
    expect(getStoredState).toHaveBeenCalledTimes(1); // Didn't need to check localStorage
  });

  it('should migrate from localStorage if sessionStorage is empty', async () => {
    // Scenario: Session is empty, but Local has data
    vi.mocked(getStoredState).mockResolvedValueOnce(undefined).mockResolvedValueOnce(mockState);

    const result = await quoteInfoPersistConfig.getStoredState!(mockConfig);

    expect(result).toEqual(mockState);
    expect(getStoredState).toHaveBeenCalledTimes(2);
    // Verify second call used the correct fallback localStorage engine
    expect(getStoredState).toHaveBeenNthCalledWith(2, expect.objectContaining({ storage }));
  });

  it('should return undefined if neither storage has data', async () => {
    // Scenario: Fresh install
    vi.mocked(getStoredState).mockResolvedValue(undefined);

    const result = await quoteInfoPersistConfig.getStoredState!(mockConfig);

    expect(result).toBeUndefined();
  });
});
