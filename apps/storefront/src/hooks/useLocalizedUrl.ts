import { useCallback } from 'react';

import { CART_URL } from '@/constants';
import { getLocalizedUrl } from '@/lib/lang/getLocalizedUrl';
import { useAppStore } from '@/store';

export const useLocalizedUrl = () => {
  const store = useAppStore();

  const getCartUrl = useCallback(() => {
    const { locales, featureFlags } = store.getState().global;

    return featureFlags['LOCAL-3626.B2B_product_translation']
      ? getLocalizedUrl(CART_URL, locales)
      : CART_URL;
  }, [store]);

  return { getCartUrl };
};
