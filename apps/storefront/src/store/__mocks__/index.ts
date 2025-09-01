import { vi } from 'vitest';

import { setupStore } from '@/store';

export * from '@/store';

beforeEach(() => {
  const store = setupStore();

  vi.spyOn(exports, 'store', 'get').mockReturnValue(store);
});
