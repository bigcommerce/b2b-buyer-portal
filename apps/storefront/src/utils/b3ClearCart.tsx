import { deleteCart, getCartInfo } from '@/shared/service/bc'
import { setCartNumber, store } from '@/store'

const clearInvoiceCart = async () => {
  try {
    const url = window.location.pathname
    const isInvoicePay = localStorage.getItem('invoicePay')

    if (url !== '/checkout' && isInvoicePay === '1') {
      const cartInfo = await getCartInfo()
      if (cartInfo) {
        await deleteCart(cartInfo[0].id)
        localStorage.removeItem('invoicePay')
        store.dispatch(setCartNumber(0))
      }
    }
  } catch (err) {
    console.error(err)
  }
}

export default clearInvoiceCart
