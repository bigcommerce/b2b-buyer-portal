import { Location, NavigateFunction } from 'react-router-dom';

import {
  b2bQuoteCheckout,
  bcQuoteCheckout,
  getBCStorefrontProductSettings,
} from '@/shared/service/b2b';
// import { createNewCart } from '@/shared/service/bc/graphql/cart';
import { setQuoteDetailToCheckoutUrl, store } from '@/store';
import { attemptCheckoutLoginAndRedirect, setQuoteToStorage } from '@/utils/b3checkout';
import b2bLogger from '@/utils/b3Logger';
import { platform } from '@/utils/basicConfig';
// import { newDataCartFromQuote } from '@/utils/cartUtils';
import { getSearchVal } from '@/utils/loginInfo';

interface QuoteCheckout {
  role: string | number;
  proceedingCheckoutFn: () => boolean;
  location: Location;
  quoteId: string;
  navigate?: NavigateFunction;
  productList: unknown[];
}

export const handleQuoteCheckout = async ({
  role,
  proceedingCheckoutFn,
  location,
  quoteId,
  navigate,
}: // productList,
QuoteCheckout) => {
  try {
    store.dispatch(setQuoteDetailToCheckoutUrl(''));

    const isHideQuoteCheckout = proceedingCheckoutFn();

    if (isHideQuoteCheckout) return;

    const {
      storefrontProductSettings: { hidePriceFromGuests },
    } = await getBCStorefrontProductSettings();

    if (hidePriceFromGuests && Number(role) === 100 && navigate) {
      store.dispatch(setQuoteDetailToCheckoutUrl(location.pathname + location.search));
      navigate('/login');
      return;
    }

    // if (platform === 'catalyst') {
    //   const cartData = newDataCartFromQuote(productList);
    //   const { data } = await createNewCart(cartData);
    //   const { entityId } = data.cart.createCart.cart;

    //   window.location.href = `/checkout?cartId=${entityId}`;
    //   return;
    // }

    const fn = Number(role) === 99 ? bcQuoteCheckout : b2bQuoteCheckout;
    const date = getSearchVal(location.search, 'date');

    const res = await fn({
      id: Number(quoteId),
    });

    setQuoteToStorage(quoteId, date);
    const {
      quoteCheckout: {
        quoteCheckout: { checkoutUrl, cartId },
      },
    } = res;

    if (platform === 'bigcommerce') {
      window.location.href = checkoutUrl;
      return;
    }

    if (platform === 'catalyst') {
      window.location.href = `/checkout?cartId=${cartId}`;
      return;
    }

    await attemptCheckoutLoginAndRedirect(cartId, checkoutUrl as string);
  } catch (err) {
    b2bLogger.error(err);
  }
};

export default handleQuoteCheckout;
