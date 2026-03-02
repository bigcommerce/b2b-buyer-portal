import { Location, NavigateFunction } from 'react-router-dom';

import { LangFormatFunction } from '@/lib/lang';
import { getBCStorefrontProductSettings, quoteCheckout } from '@/shared/service/b2b';
import type { ProductValidationError } from '@/shared/service/request/b3Fetch';
import { setQuoteDetailToCheckoutUrl, store } from '@/store';
import { attemptCheckoutLoginAndRedirect, setQuoteToStorage } from '@/utils/b3checkout';
import b2bLogger from '@/utils/b3Logger';
import { snackbar } from '@/utils/b3Tip';
import { platform } from '@/utils/basicConfig';
import { getSearchVal } from '@/utils/loginInfo';

interface QuoteCheckout {
  role: string | number;
  location: Location;
  quoteId: string;
  quoteUuid?: string;
  navigate?: NavigateFunction;
  b3Lang: LangFormatFunction;
  formatValidationError: (err: ProductValidationError) => string;
}

export const handleQuoteCheckout = async ({
  role,
  location,
  quoteId,
  quoteUuid,
  navigate,
  b3Lang,
  formatValidationError,
}: QuoteCheckout) => {
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
      uuid: quoteUuid,
    });

    const productValidationErrors = (
      res as { error?: { extensions?: { productValidationErrors?: ProductValidationError[] } } }
    )?.error?.extensions?.productValidationErrors;

    if (productValidationErrors?.length) {
      productValidationErrors.forEach((err) => {
        snackbar.error(formatValidationError(err));
      });

      return;
    }

    const checkout = (
      res as { quoteCheckout?: { quoteCheckout?: { checkoutUrl: string; cartId: string } } }
    )?.quoteCheckout?.quoteCheckout;

    if (!checkout) {
      snackbar.error(b3Lang('quotes.productValidationFailedForQuote'));
      return;
    }

    setQuoteToStorage(quoteId, date, quoteUuid);
    const { checkoutUrl, cartId } = checkout;

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
    // 40101 auth-expiry: graphqlB2B already shows a snackbar and rejects with a string; skip our message to avoid a second, incorrect snackbar
    if (typeof err === 'string') return;
    // TODO(BACK-543): Remove err.message branch when experiment is cleaned up.
    const message =
      err instanceof Error ? err.message : b3Lang('quotes.productValidationFailedForQuote');
    snackbar.error(message);
  }
};
