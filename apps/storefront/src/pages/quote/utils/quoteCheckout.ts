import { Location, NavigateFunction } from 'react-router-dom';

import {
  b2bQuoteCheckout,
  bcQuoteCheckout,
  getBCStorefrontProductSettings,
} from '@/shared/service/b2b';
import { createCartRedirectUrls, createNewCart } from '@/shared/service/bc/graphql/cart';
import { setQuoteDetailToCheckoutUrl, store } from '@/store';
import { setQuoteToStorage } from '@/utils/b3checkout';
import b2bLogger from '@/utils/b3Logger';
import { platform } from '@/utils/basicConfig';
import { newDataCart } from '@/utils/cartUtils';
import { getSearchVal } from '@/utils/loginInfo';

interface QuoteCheckout {
  role: string | number;
  proceedingCheckoutFn: () => boolean;
  location: Location;
  quoteId: string;
  navigate?: NavigateFunction;
  productList: any[];
}

export const handleQuoteCheckout = async ({
  role,
  proceedingCheckoutFn,
  location,
  quoteId,
  navigate,
  productList,
}: QuoteCheckout) => {
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

    if (platform === 'bigcommerce') {
      const fn = Number(role) === 99 ? bcQuoteCheckout : b2bQuoteCheckout;
      const date = getSearchVal(location.search, 'date');

      const res = await fn({
        id: Number(quoteId),
      });

      setQuoteToStorage(quoteId, date);
      const {
        quoteCheckout: {
          quoteCheckout: { checkoutUrl },
        },
      } = res;
      window.location.href = checkoutUrl;
      return;
    }

    if (platform === 'catalyst') {
      const cartData = newDataCart(productList);
      const { data } = await createNewCart(cartData);
      const { entityId } = data.cart.createCart.cart;
      // const {
      //   data: {
      //     cart: {
      //       createCartRedirectUrls: { redirectUrls },
      //     },
      //   },
      // } = await createCartRedirectUrls(entityId);
      // const redirect = redirectUrls.redirectedCheckoutUrl;
      // window.location.href = redirect;
      window.location.href = `/checkout/${entityId}/`;
      // const fn = Number(role) === 99 ? bcQuoteCheckout : b2bQuoteCheckout;
      // const date = getSearchVal(location.search, 'date');

      // const res = await fn({
      //   id: Number(quoteId),
      // });

      // setQuoteToStorage(quoteId, date);
      // const {
      //   quoteCheckout: {
      //     quoteCheckout: { cartId },
      //   },
      // } = res;
      // window.location.href = `/checkout/${cartId}/`;
    }
  } catch (err) {
    b2bLogger.error(err);
  }
};

export default handleQuoteCheckout;
