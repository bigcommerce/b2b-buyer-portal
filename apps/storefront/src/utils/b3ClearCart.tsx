import { getBCStoreChannelId } from '@/shared/service/b2b'
import { deleteCart, getCart } from '@/shared/service/bc/graphql/cart'
import { setCartNumber, store } from '@/store'

import getCookie from './b3utils'
import { deleteCartData } from './cartUtils'

const clearInvoiceCart = async () => {
  try {
    const url = window.location.pathname
    const isInvoicePay = localStorage.getItem('invoicePay')
    const getStoreInfo = async () => {
      const { storeBasicInfo }: CustomFieldItems = await getBCStoreChannelId()
      const [storeInfo] = storeBasicInfo.storeSites

      return storeInfo?.platform
    }

    const platform = await getStoreInfo()

    if (url !== '/checkout' && isInvoicePay === '1') {
      const cartEntityId: string = getCookie('cartId')

      const cartInfo = cartEntityId
        ? await getCart(cartEntityId, platform)
        : null
      if (cartInfo) {
        const deleteQuery = deleteCartData(cartEntityId)
        await deleteCart(deleteQuery)
        localStorage.removeItem('invoicePay')
        store.dispatch(setCartNumber(0))
      }
    }
  } catch (err) {
    console.error(err)
  }
}

export default clearInvoiceCart
