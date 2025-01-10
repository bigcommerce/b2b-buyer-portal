import { cleanup } from '@testing-library/react';

import { Environment } from '@/types';

import '@testing-library/jest-dom/vitest';

window.B3 = {
  setting: {
    channel_id: 1,
    store_hash: 'store-hash',
    platform: 'bigcommerce',
    environment: Environment.Local,
  },
};
beforeEach(() => {
  window.B3 = {
    setting: {
      channel_id: 1,
      store_hash: 'store-hash',
      platform: 'bigcommerce',
      environment: Environment.Local,
    },
  };
});
afterEach(() => {
  cleanup();
});
