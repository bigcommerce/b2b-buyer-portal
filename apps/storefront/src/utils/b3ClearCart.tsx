import { deleteCart, getCart } from '@/shared/service/bc/graphql/cart'
import { store } from '@/store/reducer'
import { setCartNumber } from '@/store/slices/global'
import { b2bLogger } from '@/utils'

import getCookie from './b3utils'
import { deleteCartData } from './cartUtils'

const clearInvoiceCart = async () => {
  try {
    const url = window.location.pathname
    const isInvoicePay = localStorage.getItem('invoicePay')

    const {
      global: {
        storeInfo: { platform },
      },
    } = store.getState()

    if (url !== '/checkout' && isInvoicePay === '1') {
      const cartEntityId: string = getCookie('cartId')

      const cartInfo = cartEntityId
        ? await getCart(cartEntityId, platform)
        : null

      if (cartInfo) {
        let newCartId = cartEntityId
        if (cartInfo?.data && cartInfo?.data?.site) {
          const { cart } = cartInfo.data.site
          newCartId = cart?.entityId || cartEntityId
        }

        const deleteQuery = deleteCartData(newCartId)
        await deleteCart(deleteQuery)
        localStorage.removeItem('invoicePay')
        store.dispatch(setCartNumber(0))
        const cartNumberDom = document.querySelector(
          '.cart-quantity.countPill--positive'
        )
        if (cartNumberDom) {
          cartNumberDom.className = 'countPill cart-quantity'
        }
      }
    }
  } catch (err) {
    b2bLogger.error(err)
  }
}

export default clearInvoiceCart
