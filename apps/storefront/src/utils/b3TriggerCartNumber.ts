import Cookies from 'js-cookie'

import { getCart } from '@/shared/service/bc/graphql/cart'
import { setCartNumber, store } from '@/store'

import getCookie from './b3utils'

const productTypeKey = [
  'customItems',
  'digitalItems',
  'giftCertificates',
  'physicalItems',
]

const b3TriggerCartNumber = async () => {
  const cartId = getCookie('cartId')
  let number = 0

  const {
    global: { storeInfo },
  } = store.getState()

  try {
    const storePlatform = storeInfo?.platform
    const cartInfo = await getCart(cartId, storePlatform)

    if (cartInfo.data.site.cart) {
      const cartId = cartInfo.data.site.cart.entityId
      Cookies.set('cartId', cartId)
      const items = cartInfo.data.site.cart.lineItems
      productTypeKey.forEach((key: string) => {
        const productItem = items[key]
        if (productItem && productItem.length > 0) {
          if (key === 'giftCertificates') {
            number += productItem.length
          } else {
            productItem.forEach((item: CustomFieldItems) => {
              number += +item.quantity
            })
          }
        }
      })
    }
  } catch (err) {
    console.error(err)
  }

  store.dispatch(setCartNumber(number))
}

export default b3TriggerCartNumber
