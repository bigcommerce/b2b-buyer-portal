import { deleteCart, getCartInfo } from '@/shared/service/bc'

const clearInvoiceCart = async () => {
  try {
    const url = window.location.pathname
    const isInvoicePay = localStorage.getItem('invoicePay')

    if (url !== '/checkout' && isInvoicePay === '1') {
      const cartInfo = await getCartInfo()
      if (cartInfo) {
        await deleteCart(cartInfo[0].id)
        localStorage.removeItem('invoicePay')
      }
    }
  } catch (err) {
    console.error(err)
  }
}

export default clearInvoiceCart
