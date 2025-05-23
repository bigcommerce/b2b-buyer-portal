export * from '@/store';
import { vi } from 'vitest';

import { setupStore } from '@/store';

beforeEach(() => {
  const store = setupStore();

  vi.spyOn(exports, 'store', 'get').mockReturnValue(store);
});
