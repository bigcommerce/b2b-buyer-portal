// eslint-disable-next-line testing-library/no-manual-cleanup
import { cleanup } from '@testing-library/react';
import Cookies from 'js-cookie';
import { unset } from 'lodash-es';
import failOnConsole from 'vitest-fail-on-console';

import { Environment } from '@/types';

import 'vitest-location-mock';
import '@testing-library/jest-dom/vitest';

vi.mock('@/store');

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

  // Required to stop `useMobile` from triggering the mobile layouts in tests
  vi.spyOn(document.body, 'clientWidth', 'get').mockReturnValue(1000);
});

const cleanAllCookies = () => {
  Object.entries(Cookies.get()).forEach(([key]) => {
    Cookies.remove(key);
  });
};

afterEach(() => {
  cleanup();
  cleanAllCookies();
  unset(window, 'b2b');
});

failOnConsole({
  silenceMessage: (message: string) => {
    // TODO: These warn in production, will have to be fixed in the future.
    if (message.includes('which is more than the warning threshold of')) {
      return true;
    }

    if (message.includes('The value provided to Autocomplete is invalid.')) {
      return true;
    }

    return false;
  },
  shouldFailOnLog: Boolean(process.env.CI),
  shouldFailOnWarn: Boolean(process.env.CI),
  shouldFailOnInfo: Boolean(process.env.CI),
  shouldFailOnError: Boolean(process.env.CI),
});
