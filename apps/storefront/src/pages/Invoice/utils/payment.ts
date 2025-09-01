import round from 'lodash-es/round';

import { getInvoiceCheckoutUrl } from '@/shared/service/b2b';
import { BcCartData } from '@/types/invoice';
import { attemptCheckoutLoginAndRedirect } from '@/utils/b3checkout';
import b2bLogger from '@/utils/b3Logger';

const getCheckoutUrlAndCart = async (params: BcCartData) => {
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

export const gotoInvoiceCheckoutUrl = async (
  params: BcCartData,
  platform: string,
  isReplaceCurrentUrl?: boolean,
) => {
  const { checkoutUrl, cartId } = await getCheckoutUrlAndCart(params);
  const handleStencil = () => {
    if (isReplaceCurrentUrl) {
      window.location.replace(checkoutUrl);
    } else {
      window.location.href = checkoutUrl;
    }
  };

  if (platform === 'bigcommerce') {
    handleStencil();
    return;
  }

  if (platform === 'catalyst') {
    window.location.assign(`/checkout?cartId=${cartId}`);
    return;
  }

  try {
    await attemptCheckoutLoginAndRedirect(cartId, checkoutUrl, isReplaceCurrentUrl);
  } catch (e) {
    b2bLogger.error(e);
    handleStencil();
  }
};

export const formattingNumericValues = (value: number, decimalPlaces: number) =>
  round(Number(value), decimalPlaces).toFixed(decimalPlaces);
