import { cleanup } from '@testing-library/react';

import '@testing-library/jest-dom/vitest';

window.B3 = {
  setting: {
    channel_id: Number.NaN,
    store_hash: '',
    platform: 'bigcommerce',
    b2b_url: '',
    captcha_setkey: '',
  },
};
beforeEach(() => {
  window.B3 = {
    setting: {
      channel_id: Number.NaN,
      store_hash: '',
      platform: 'bigcommerce',
      b2b_url: '',
      captcha_setkey: '',
    },
  };
});
afterEach(() => {
  cleanup();
});
