import { store } from '@/store';

import { getActiveLocale } from './getActiveLocale';

export const getStorefrontLanguageCode = () => {
  const { locales, featureFlags } = store.getState().global;
  const isMultiLanguageEnabled = Boolean(featureFlags['LOCAL-3191.B2B_multi_language']);

  if (!isMultiLanguageEnabled) {
    return undefined;
  }

  return getActiveLocale(locales)?.code;
};
