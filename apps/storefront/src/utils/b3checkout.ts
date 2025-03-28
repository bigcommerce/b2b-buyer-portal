import { b2bCheckoutLogin } from '@/shared/service/b2b/graphql/checkout';
import { platform } from './basicConfig';

export const redirect = (url: string, isReplaceCurrentUrl?: boolean) => {
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
  if (['bigcommerce', 'catalyst'].includes(platform)) {
    throw new Error('unsupported platform for checkout login');
  }

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

export const setQuoteToStorage = (quoteId: string, date: any) => {
  sessionStorage.setItem('isNewStorefront', JSON.stringify(true));
  sessionStorage.setItem('quoteCheckoutId', quoteId);
  sessionStorage.setItem('quoteDate', date?.toString());
};
