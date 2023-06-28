import { getInvoiceCheckoutUrl } from '@/shared/service/b2b'
import { BcCartData } from '@/types/invoice'

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
  const { checkoutUrl } = await getCheckouUrlAndCart(params)

  if (isReplaceCurrentUrl) {
    window.location.replace(checkoutUrl)
  } else {
    window.location.href = checkoutUrl
  }
}
