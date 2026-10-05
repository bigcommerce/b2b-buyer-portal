import { store } from '@/store';

import { getActiveLocale } from './getActiveLocale';

interface ActiveDateLocale {
  code: string;
  isDefault: boolean;
}

export const getActiveDateLocale = (): ActiveDateLocale | undefined => {
  const { locales, featureFlags } = store.getState().global;

  if (!featureFlags['LOCAL-3509.Translate_b2b_dates']) {
    return undefined;
  }

  const activeLocale = getActiveLocale(locales);

  return (
    activeLocale || {
      code: 'en',
      isDefault: true,
    }
  );
};
