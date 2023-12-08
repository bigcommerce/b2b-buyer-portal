import { getInvoiceCheckoutUrl } from '@/shared/service/b2b'
import { BcCartData } from '@/types/invoice'
import { attemptCheckoutLoginAndRedirect } from '@/utils/b3checkout'

export const getCheckouUrlAndCart = async (params: BcCartData) => {
  const {
    invoiceCreateBcCart: {
      result: { checkoutUrl, cartId },
    },
  } = await getInvoiceCheckoutUrl(params)

  return {
    checkoutUrl,
    cartId,
  }
}

export const gotoInvoiceCheckoutUrl = async (
  params: BcCartData,
  isReplaceCurrentUrl?: boolean
) => {
  const { checkoutUrl, cartId } = await getCheckouUrlAndCart(params)

  try {
    await attemptCheckoutLoginAndRedirect(
      cartId,
      checkoutUrl,
      isReplaceCurrentUrl
    )
  } catch (e) {
    if (isReplaceCurrentUrl) {
      window.location.replace(checkoutUrl)
    } else {
      window.location.href = checkoutUrl
    }
  }
}
