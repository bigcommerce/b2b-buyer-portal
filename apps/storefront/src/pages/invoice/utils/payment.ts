import { getInvoiceCheckoutUrl } from '@/shared/service/b2b'
import { BcCartData } from '@/types/invoice'
import { attemptCheckoutLoginAndRedirect } from '@/utils/b3checkout'
import b2bLogger from '@/utils/b3Logger'

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
  platform: string,
  isReplaceCurrentUrl?: boolean
) => {
  const { checkoutUrl, cartId } = await getCheckouUrlAndCart(params)
  const handleStencil = () => {
    if (isReplaceCurrentUrl) {
      window.location.replace(checkoutUrl)
    } else {
      window.location.href = checkoutUrl
    }
  }

  if (platform === 'bigcommerce') {
    handleStencil()
    return
  }

  try {
    await attemptCheckoutLoginAndRedirect(
      cartId,
      checkoutUrl,
      isReplaceCurrentUrl
    )
  } catch (e) {
    b2bLogger.error(e)
    handleStencil()
  }
}
