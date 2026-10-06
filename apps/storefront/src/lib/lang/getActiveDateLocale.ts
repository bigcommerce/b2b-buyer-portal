import { store } from '@/store';

import { getActiveLocale } from './getActiveLocale';
import { isSupportedLocale } from './locales';

export const getActiveDateLocale = (): string | undefined => {
  const { locales, featureFlags } = store.getState().global;

  if (!featureFlags['LOCAL-3509.Translate_b2b_dates']) {
    return undefined;
  }

  const code = getActiveLocale(locales)?.code;

  if (!code || code.toLowerCase().split('-')[0] === 'en' || !isSupportedLocale(code)) {
    return undefined;
  }

  return code;
};
