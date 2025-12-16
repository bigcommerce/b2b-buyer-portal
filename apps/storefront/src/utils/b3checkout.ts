import { b2bCheckoutLogin } from '@/shared/service/b2b/graphql/checkout';

const redirect = (url: string, isReplaceCurrentUrl?: boolean) => {
  if (isReplaceCurrentUrl) {
    window.location.replace(url);
  } else {
    window.location.href = url;
  }
};

export const attemptCheckoutLoginAndRedirect = async (
  cartId: any,
  defaultCheckoutUrl: string,
  isReplaceCurrentUrl?: boolean,
) => {
  try {
    const resLogin = await b2bCheckoutLogin({
      cartData: { cartId },
    });

    const {
      checkoutLogin: { result },
    } = resLogin;

    redirect(result.redirectUrl, isReplaceCurrentUrl);
  } catch (e) {
    redirect(defaultCheckoutUrl, isReplaceCurrentUrl);
  }
};

export const setQuoteToStorage = (quoteId: string, date: any, quoteUuid?: string) => {
  sessionStorage.setItem('isNewStorefront', JSON.stringify(true));
  sessionStorage.setItem('quoteCheckoutId', quoteId);
  sessionStorage.setItem('quoteDate', date?.toString());
  sessionStorage.setItem('quoteCheckoutUuid', quoteUuid || '');
};
