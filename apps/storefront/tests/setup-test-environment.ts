import { cleanup } from '@testing-library/react';

import { Environment } from '@/types';

import '@testing-library/jest-dom/vitest';

window.B3 = {
  setting: {
    channel_id: Number.NaN,
    store_hash: '',
    platform: 'bigcommerce',
    environment: Environment.Local,
  },
};
beforeEach(() => {
  window.B3 = {
    setting: {
      channel_id: Number.NaN,
      store_hash: '',
      platform: 'bigcommerce',
      environment: Environment.Local,
    },
  };
});
afterEach(() => {
  cleanup();
});
