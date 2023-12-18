import { b2bCheckoutLogin } from '@/shared/service/b2b/graphql/checkout'
import { cipherText } from '@/utils/cryptoJs'

const redirect = (url: string, isReplaceCurrentUrl?: boolean) => {
  if (isReplaceCurrentUrl) {
    window.location.replace(url)
  } else {
    window.location.href = url
  }
}

export const attemptCheckoutLoginAndRedirect = async (
  cartId: any,
  defaultCheckoutUrl: string,
  isReplaceCurrentUrl?: boolean
) => {
  try {
    const resLogin = await b2bCheckoutLogin({
      cartData: { cartId },
    })

    const {
      checkoutLogin: { result },
    } = resLogin

    redirect(result.redirectUrl, isReplaceCurrentUrl)
  } catch (e) {
    redirect(defaultCheckoutUrl, isReplaceCurrentUrl)
  }
}

export const setQuoteToStorage = (quoteId: string, date: any) => {
  sessionStorage.setItem('isNewStorefront', JSON.stringify(true))
  sessionStorage.setItem('quoteCheckoutId', cipherText(quoteId))
  sessionStorage.setItem(
    'quoteDate',
    cipherText(date?.toString() || '')
  )
}
