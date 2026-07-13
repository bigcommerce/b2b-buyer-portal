import { Location, NavigateFunction } from 'react-router-dom';

import { LangFormatFunction } from '@/lib/lang';
import { getBCStorefrontProductSettings, quoteCheckout } from '@/shared/service/b2b';
import type { ProductValidationError } from '@/shared/service/request/b3Fetch';
import { setQuoteDetailToCheckoutUrl, store } from '@/store';
import { isLoggedInSelector } from '@/store/selectors';
import { attemptCheckoutLoginAndRedirect, setQuoteToStorage } from '@/utils/b3checkout';
import b2bLogger from '@/utils/b3Logger';
import { snackbar } from '@/utils/b3Tip';
import { platform, PLATFORM_BIGCOMMERCE, PLATFORM_CATALYST } from '@/utils/basicConfig';
import { getSearchVal } from '@/utils/loginInfo';

import { detectQuoteStockChange, QuoteStockSnapshotItem } from './detectQuoteStockChange';

export const QUOTE_BACKORDER_CHANGE_STORAGE_KEY = 'b2b.quote.backorderChange';

type ValidationErrorResponse = {
  error?: {
    extensions?: {
      productValidationErrors?: ProductValidationError[];
    };
  };
};

type CheckoutResponse = {
  quoteCheckout?: {
    quoteCheckout?: {
      checkoutUrl: string;
      cartId: string;
    };
  };
};

type ErrorWithExtensions = Error & { extensions?: { code?: number } };

interface QuoteCheckout {
  role: string | number;
  location: Location;
  quoteId: string;
  quoteUuid?: string;
  navigate?: NavigateFunction;
  b3Lang: LangFormatFunction;
  formatValidationError: (err: ProductValidationError) => string;
  isBackorderMessagingEnabled?: boolean;
  quoteStockSnapshot?: QuoteStockSnapshotItem[];
  fetchCurrentStockSnapshot?: () => Promise<QuoteStockSnapshotItem[]>;
}

export const handleQuoteCheckout = async ({
  role,
  location,
  quoteId,
  quoteUuid,
  navigate,
  b3Lang,
  formatValidationError,
  isBackorderMessagingEnabled = false,
  quoteStockSnapshot,
  fetchCurrentStockSnapshot,
}: QuoteCheckout) => {
  try {
    // Clear any stale flag from a previous attempt so this checkout produces a fresh verdict.
    sessionStorage.removeItem(QUOTE_BACKORDER_CHANGE_STORAGE_KEY);

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

    const productValidationErrors = (res as ValidationErrorResponse)?.error?.extensions
      ?.productValidationErrors;

    if (productValidationErrors?.length) {
      productValidationErrors.forEach((err) => {
        snackbar.error(formatValidationError(err));
      });

      return;
    }

    const checkout = (res as CheckoutResponse)?.quoteCheckout?.quoteCheckout;

    if (!checkout) {
      snackbar.error(b3Lang('quotes.productValidationFailedForQuote'));
      return;
    }

    setQuoteToStorage(quoteId, date, quoteUuid);
    const { checkoutUrl, cartId } = checkout;

    if (
      isBackorderMessagingEnabled &&
      quoteStockSnapshot &&
      quoteStockSnapshot.length &&
      fetchCurrentStockSnapshot
    ) {
      try {
        const afterSnapshot = await fetchCurrentStockSnapshot();
        const stockChange = detectQuoteStockChange(quoteStockSnapshot, afterSnapshot);

        if (stockChange) {
          sessionStorage.setItem(QUOTE_BACKORDER_CHANGE_STORAGE_KEY, 'true');
        }
      } catch (e) {
        b2bLogger.error(e);
      }
    }

    if (platform === PLATFORM_BIGCOMMERCE) {
      window.location.href = checkoutUrl;
      return;
    }

    if (platform === PLATFORM_CATALYST) {
      window.location.href = `/checkout?cartId=${cartId}`;
      return;
    }

    await attemptCheckoutLoginAndRedirect(cartId, checkoutUrl as string);
  } catch (err) {
    b2bLogger.error(err);
    // 40101 auth-expiry: graphqlB2B already shows a snackbar and rejects with a string; skip our message to avoid a second, incorrect snackbar
    if (typeof err === 'string') return;

    const code = (err as ErrorWithExtensions)?.extensions?.code;
    const isUserLoggedIn = isLoggedInSelector(store.getState());
    if (code === 401 || code === 403) {
      if (!isUserLoggedIn) {
        store.dispatch(setQuoteDetailToCheckoutUrl(location.pathname + location.search));
        if (navigate) navigate('/login');
        return;
      }
      snackbar.error(b3Lang('quoteDetail.error.unauthorized'));
      return;
    }

    // TODO(BACK-543): Remove err.message branch when experiment is cleaned up.
    const message =
      err instanceof Error ? err.message : b3Lang('quotes.productValidationFailedForQuote');
    snackbar.error(message);
  }
};
