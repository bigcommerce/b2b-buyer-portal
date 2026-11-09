import { store } from '@/store';

import { getActiveLocale } from './getActiveLocale';

export const getStorefrontLanguageCode = () => {
  const { locales, featureFlags } = store.getState().global;
  // Locales are only loaded by setStorefrontConfig (utils/storefrontConfig.ts) when one of its
  // flags is on, so a flag added here must be added there too, or no locale will ever match.
  const isMultiLanguageEnabled = Boolean(
    featureFlags['LOCAL-3280.B2B_email_multi_language'] ||
      featureFlags['LOCAL-3626.B2B_product_translation'],
  );

  if (!isMultiLanguageEnabled) {
    return undefined;
  }

  return getActiveLocale(locales)?.code;
};
