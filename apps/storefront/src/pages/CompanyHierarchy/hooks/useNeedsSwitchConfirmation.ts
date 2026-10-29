import Cookies from 'js-cookie';

import { cartOrDraftNotEmptySelector, useAppSelector } from '@/store';

// A company-context change clears the cart and draft quote. cartNumber is a cached
// count, but the cart delete keys off the cartId cookie — so a live cart cookie also
// counts as "needs confirmation", to avoid silently clearing a cart when the cached
// count is stale.
export function useNeedsSwitchConfirmation() {
  const cartOrDraftNotEmpty = useAppSelector(cartOrDraftNotEmptySelector);

  return cartOrDraftNotEmpty || Boolean(Cookies.get('cartId'));
}
