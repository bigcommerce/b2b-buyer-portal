import { createSerializer } from '@emotion/jest';
import { cleanup } from '@testing-library/react';

expect.addSnapshotSerializer(createSerializer());

expect.addSnapshotSerializer({
  test: (val) => /:r\d+:/.test(val),
  print: (val) => {
    if (typeof val === 'string') {
      return `"${val.split(/:r\d+:/g).join(':rX:')}"`;
    }

    return '';
  },
});

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
