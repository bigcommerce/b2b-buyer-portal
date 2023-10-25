import { getCartInfo } from '@/shared/service/bc'
import { setCartNumber, store } from '@/store'

const productTypeKey = [
  'customItems',
  'digitalItems',
  'giftCertificates',
  'physicalItems',
]

const b3TriggerCartNumber = async () => {
  let number = 0
  try {
    const cartInfo = await getCartInfo()
    if (cartInfo.length > 0) {
      const items = cartInfo[0].lineItems
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
