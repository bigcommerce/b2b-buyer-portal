import {
  addNewLineToCart,
  createNewCart,
  getCart,
} from '@/shared/service/bc/graphql/cart'

import { LineItems } from './b3Product/b3Product'
import getCookie from './b3utils'

export const handleSplitOptionId = (id: string | number) => {
  if (typeof id === 'string' && id.includes('attribute')) {
    const idRight = id.split('[')[1]

    const optionId = idRight.split(']')[0]
    return +optionId
  }

  if (typeof id === 'number') {
    return id
  }

  return undefined
}

const cartLineItems = (products: any) => {
  const items = products.map((product: any) => {
    const {
      newSelectOptionList,
      quantity,
      optionSelections,
      allOptions = [],
    } = product
    let options = []
    options = newSelectOptionList || optionSelections
    const selectedOptions = options.reduce(
      (a: any, c: any) => {
        const optionValue = parseInt(c.optionValue, 10)
        const splitOptionId = handleSplitOptionId(c.optionId)
        const productOption = allOptions.find((option: CustomFieldItems) => {
          const id = option?.product_option_id || option?.id || ''
          return id === splitOptionId
        })
        if (
          Number.isNaN(optionValue) ||
          productOption?.type === 'text' ||
          productOption?.type === 'Text field'
        ) {
          a.textFields.push({
            optionEntityId: splitOptionId,
            text: c.optionValue,
          })
        } else if (typeof optionValue === 'number') {
          a.multipleChoices.push({
            optionEntityId: splitOptionId,
            optionValueEntityId: parseInt(c.optionValue, 10),
          })
        }

        return a
      },
      {
        multipleChoices: [],
        textFields: [],
      }
    )

    return {
      quantity: parseInt(quantity || product.qty, 10),
      productEntityId: parseInt(product.productId || product.id, 10),
      variantEntityId: parseInt(
        product.variantId || product.products.variantId,
        10
      ),
      selectedOptions,
    }
  })

  return items
}

export const newDataCart = (productData: any) => ({
  createCartInput: {
    lineItems: cartLineItems(productData),
  },
})

export const deleteCartData = (entityId: any) => ({
  deleteCartInput: {
    cartEntityId: entityId,
  },
})

const getLineItemsData = (cartInfo: any, productData: any) => {
  const lineItems = cartLineItems(productData)

  return {
    addCartLineItemsInput: {
      cartEntityId: cartInfo.data.site.cart.entityId,
      data: {
        lineItems,
      },
    },
  }
}

export const createNewShoppingCart = async (products: any) => {
  const cartData = newDataCart(products)
  const res = await createNewCart(cartData)

  return res
}

export const updateCart = async (
  cartInfo: any,
  productData: any,
  platform: string
) => {
  const newItems = getLineItemsData(cartInfo, productData)
  const res = await addNewLineToCart(newItems, platform)

  return res
}

export const callCart = async (
  lineItems: LineItems[] | CustomFieldItems[],
  storePlatform: string
) => {
  const cartEntityId: string = getCookie('cartId')

  const cartInfo = cartEntityId
    ? await getCart(cartEntityId, storePlatform)
    : null

  const res =
    cartInfo && cartInfo?.data?.site?.cart
      ? await updateCart(cartInfo, lineItems, storePlatform)
      : await createNewShoppingCart(lineItems)

  return res
}
