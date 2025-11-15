import { Location, NavigateFunction } from 'react-router-dom';

import { getBCStorefrontProductSettings, quoteCheckout } from '@/shared/service/b2b';
import { setQuoteDetailToCheckoutUrl, store } from '@/store';
import { attemptCheckoutLoginAndRedirect, setQuoteToStorage } from '@/utils/b3checkout';
import b2bLogger from '@/utils/b3Logger';
import { platform } from '@/utils/basicConfig';
import { getSearchVal } from '@/utils/loginInfo';

interface QuoteCheckout {
  role: string | number;
  location: Location;
  quoteId: string;
  navigate?: NavigateFunction;
}

export const handleQuoteCheckout = async ({ role, location, quoteId, navigate }: QuoteCheckout) => {
  try {
    store.dispatch(setQuoteDetailToCheckoutUrl(''));

    const {
      storefrontProductSettings: { hidePriceFromGuests },
    } = await getBCStorefrontProductSettings();

    if (hidePriceFromGuests && Number(role) === 100 && navigate) {
      store.dispatch(setQuoteDetailToCheckoutUrl(location.pathname + location.search));
      navigate('/login');
      return;
    }

    const date = getSearchVal(location.search, 'date');

    const res = await quoteCheckout({
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
