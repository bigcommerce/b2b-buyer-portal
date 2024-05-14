import { getCart } from '@/shared/service/bc/graphql/cart'
import { setCartNumber, store } from '@/store'

import b2bLogger from './b3Logger'

const productTypeKey = [
  'customItems',
  'digitalItems',
  'giftCertificates',
  'physicalItems',
]

const b3TriggerCartNumber = async () => {
  let number = 0

  try {
    const cartInfo = await getCart()

    if (cartInfo.data.site.cart) {
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
    b2bLogger.error(err)
  }

  store.dispatch(setCartNumber(number))
}

export default b3TriggerCartNumber
