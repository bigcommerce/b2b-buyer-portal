import round from 'lodash-es/round';

import { getInvoiceCheckoutUrl } from '@/shared/service/b2b';
import { BcCartData } from '@/types/invoice';
import { attemptCheckoutLoginAndRedirect, redirect } from '@/utils/b3checkout';
import b2bLogger from '@/utils/b3Logger';

export const getCheckoutUrlAndCart = async (params: BcCartData) => {
  const {
    invoiceCreateBcCart: {
      result: { checkoutUrl, cartId },
    },
  } = await getInvoiceCheckoutUrl(params);

  return {
    checkoutUrl,
    cartId,
  };
};

export const gotoInvoiceCheckoutUrl = async (params: BcCartData, isReplaceCurrentUrl?: boolean) => {
  let checkoutUrl;
  let cartId;
  try {
    ({ checkoutUrl, cartId } = await getCheckoutUrlAndCart(params));
  } catch (e) {
    b2bLogger.error(e);
    return;
  }

  try {
    await attemptCheckoutLoginAndRedirect(cartId, checkoutUrl, isReplaceCurrentUrl);
  } catch (e) {
    redirect(checkoutUrl, isReplaceCurrentUrl);
  }
};

export const formattingNumericValues = (value: number, decimalPlaces: number) =>
  round(Number(value), decimalPlaces).toFixed(decimalPlaces);
