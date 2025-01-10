import { store } from '@/store';
import crossTabSync from '@/store/cross-tab-sync';

const initialState = {
  draftQuoteList: [],
};

describe('crossTabSync', () => {
  let unsubscribe: (() => void) | void;

  beforeEach(() => {
    localStorage.clear();
    unsubscribe?.();
  });

  afterEach(() => {
    unsubscribe?.();
  });

  test('should sync state across tabs when a storage event is triggered', () => {
    unsubscribe = crossTabSync(store, 'quoteInfo');

    const newState = {
      ...initialState,
      draftQuoteList: JSON.stringify([{ node: { id: 1 } }]),
    };

    const storageEvent = new StorageEvent('storage', {
      key: 'persist:quoteInfo',
      newValue: JSON.stringify(newState),
    });

    window.dispatchEvent(storageEvent);

    setTimeout(() => {
      const state = store.getState();
      expect(state.quoteInfo.draftQuoteList).toEqual([{ node: { id: 1 } }]);
    }, 500);
  });
});
