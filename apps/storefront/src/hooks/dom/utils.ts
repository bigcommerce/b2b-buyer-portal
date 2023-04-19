import {
  SetStateAction,
  Dispatch,
} from 'react'

import type {
  OpenPageState,
} from '@b3/hooks'

import {
  v1 as uuid,
} from 'uuid'
import {
  searchB2BProducts,
  searchBcProducts,
} from '@/shared/service/b2b'

import {
  getCartInfoWithOptions,
} from '@/shared/service/bc'

import {
  addQuoteDraftProduce,
  isAllRequiredOptionFilled,
  getModifiersPrice,
  getProductExtraPrice,
  globalSnackbar,
} from '@/utils'

import {
  PRODUCT_DEFAULT_IMAGE,
} from '@/constants'

import {
  conversionProductsList,
} from '../../utils/b3Product/shared/config'

import {
  B3AddToQuoteTip,
} from '@/components'

import {
  serialize,
  getProductOptionList,
} from '../../pages/pdp/PDP'

type DispatchProps = Dispatch<SetStateAction<OpenPageState>>

interface DiscountsProps {
  discountedAmount: number,
  id: string,
}

interface ProductOptionsProps {
  name: string,
  nameId: number | string,
  value: number | string,
  valueId: number | string,
}

interface ProductItemProps {
  brand: string | number,
  couponAmount: number,
  discountAmount: number,
  discounts: Array<any>,
  extendedListPrice: number,
  extendedSalePrice: number,
  giftWrapping: any,
  id: string,
  imageUrl: string,
  isMutable: boolean,
  isShippingRequired: boolean,
  isTaxable: boolean,
  listPrice: number,
  name: string,
  options: ProductOptionsProps[],
  originalPrice: number,
  parentId: string | number | null,
  productId: number,
  quantity: number,
  salePrice: number,
  sku: string,
  type: string,
  url: string,
  variantId: number,
}

interface LineItemsProps {
  customItems: Array<CustomFieldItems>,
  digitalItems: Array<CustomFieldItems>,
  giftCertificates: Array<CustomFieldItems>,
  physicalItems: ProductItemProps[],
}

type Cart = 'customItems' | 'digitalItems' | 'giftCertificates' | 'physicalItems'

interface CartInfoProps {
  baseAmount: number,
  cartAmount: number,
  coupons: any,
  createdTime: string,
  currency: {
    code: string,
    decimalPlaces: number,
    name: string,
    symbol: string,
  },
  customerId: number,
  discountAmount: number,
  discounts: DiscountsProps[],
  email: string,
  id: string,
  isTaxIncluded: boolean,
  lineItems: LineItemsProps,
  locale: string,
  updatedTime: string,
}

const productTypes: Array<Cart> = ['customItems', 'digitalItems', 'giftCertificates', 'physicalItems']

const addLoadding = (b3CartToQuote: any) => {
  const loadingDiv = document.createElement('div')
  loadingDiv.setAttribute('id', 'b2b-div-loading')
  const loadingBtn = document.createElement('div')
  loadingBtn.setAttribute('class', 'b2b-btn-loading')
  loadingDiv.appendChild(loadingBtn)
  b3CartToQuote.appendChild(loadingDiv)
}

const removeElement = (_element: CustomFieldItems) => {
  const _parentElement = _element.parentNode
  if (_parentElement) {
    _parentElement.removeChild(_element)
  }
}

const removeLoadding = () => {
  const b2bLoading = document.querySelector('#b2b-div-loading')
  if (b2bLoading) removeElement(b2bLoading)
}

const gotoQuoteDraft = (setOpenPage: DispatchProps) => {
  setOpenPage({
    isOpen: true,
    openUrl: '/quoteDraft',
    params: {
      quoteBtn: 'open',
    },
  })
}

const addQuoteToCart = (setOpenPage: DispatchProps) => {
  const getCartProducts = (lineItems: LineItemsProps) => {
    const cartProductsList: CustomFieldItems[] = []

    productTypes.forEach((type: Cart) => {
      if (lineItems[type].length > 0) {
        lineItems[type].forEach((product: ProductItemProps | CustomFieldItems) => {
          if (!product.parentId) {
            cartProductsList.push(product)
          }
        })
      }
    })

    return cartProductsList
  }

  const getOptionsList = (options: ProductOptionsProps[] | []) => {
    if (options?.length === 0) return []

    const option = options.map(({
      nameId,
      valueId,
      value,
    }) => {
      let optionValue: number | string = valueId.toString()
      if (typeof valueId === 'number' && valueId.toString().length === 10) {
        optionValue = value
      }

      return ({
        optionId: `attribute[${nameId}]`,
        optionValue,
      })
    })

    return option
  }

  const addToQuote = async () => {
    try {
      const cartInfoWithOptions: CartInfoProps | any = await getCartInfoWithOptions()

      if (!cartInfoWithOptions[0]) {
        globalSnackbar.error('No products in Cart.', {
          isClose: true,
        })
        return
      }

      const {
        lineItems,
      } = cartInfoWithOptions[0]

      const cartProductsList = getCartProducts(lineItems)

      if (cartProductsList.length === 0) {
        globalSnackbar.error('No products being added.', {
          isClose: true,
        })
      }

      const productsWithSKU = cartProductsList.filter(({
        sku,
      }) => !!sku)

      const productIds: number[] = []
      productsWithSKU.forEach((product: CustomFieldItems) => {
        if (!productIds.includes(+product.productId)) {
          productIds.push(+product.productId)
        }
      })

      const {
        productsSearch,
      } = await searchB2BProducts({
        productIds,
      })

      const newProductInfo: CustomFieldItems = conversionProductsList(productsSearch)
      productsWithSKU.forEach((product) => {
        const {
          options,
          sku,
          productId,
          name,
          quantity,
          variantId,
          salePrice,
          imageUrl,
          listPrice,
        } = product

        const optionsList = getOptionsList(options)

        const currentProductSearch = newProductInfo.find((product: any) => +product.id === +productId)

        const quoteListitem = {
          node: {
            id: uuid(),
            variantSku: sku,
            variantId,
            productsSearch: currentProductSearch,
            primaryImage: imageUrl || PRODUCT_DEFAULT_IMAGE,
            productName: name,
            quantity: +quantity || 1,
            optionList: JSON.stringify(optionsList),
            productId,
            basePrice: listPrice,
            tax: salePrice - listPrice,
          },
        }

        addQuoteDraftProduce(quoteListitem, quantity, optionsList || [])
      })

      globalSnackbar.success('Product was added to your quote.', {
        jsx: () => B3AddToQuoteTip({
          gotoQuoteDraft: () => gotoQuoteDraft(setOpenPage),
        }),
        isClose: true,
      })
    } catch (e) {
      console.log(e)
    } finally {
      removeLoadding()
    }
  }

  return {
    addToQuote,
    addLoadding,
  }
}

const addQuoteToProduct = (setOpenPage: DispatchProps) => {
  const addToQuote = async (role: string | number) => {
    try {
      const productId = (document.querySelector('input[name=product_id]') as CustomFieldItems)?.value
      const qty = (document.querySelector('[name="qty[]"]') as CustomFieldItems)?.value ?? 1
      const sku = (document.querySelector('[data-product-sku]')?.innerHTML ?? '').trim()
      const form = document.querySelector('form[data-cart-item-add]')

      const fn = +role === 99 || +role === 100 ? searchBcProducts : searchB2BProducts

      const {
        productsSearch,
      } = await fn({
        productIds: [+productId],
      })

      const newProductInfo: CustomFieldItems = conversionProductsList(productsSearch)
      const {
        allOptions,
        variants,
      } = newProductInfo[0]

      const variantItem = variants.find((item: CustomFieldItems) => item.sku === sku)

      const optionMap = serialize(form)

      const optionList = getProductOptionList(optionMap)

      const modifiersPrice = getModifiersPrice(productsSearch[0]?.modifiers || [], optionList)

      const productExtraPrice = await getProductExtraPrice(productsSearch[0]?.modifiers || [], optionList, +role)

      const additionalCalculatedPrices = [...modifiersPrice, ...productExtraPrice]
      const {
        isValid,
        message,
      } = isAllRequiredOptionFilled(allOptions, optionList)
      if (!isValid) {
        globalSnackbar.error(message, {
          isClose: true,
        })
        return
      }

      const quoteListitem = {
        node: {
          id: uuid(),
          variantSku: variantItem.sku,
          variantId: variantItem.variantId,
          productsSearch: newProductInfo[0],
          primaryImage: variantItem.image_url,
          productName: newProductInfo[0].name,
          quantity: +qty,
          optionList: JSON.stringify(optionList),
          productId,
          additionalCalculatedPrices,
          basePrice: variantItem.bc_calculated_price.as_entered,
          tax: variantItem.bc_calculated_price.tax_inclusive - variantItem.bc_calculated_price.tax_exclusive,
        },
      }

      addQuoteDraftProduce(quoteListitem, qty, optionList || [])

      globalSnackbar.success('Product was added to your quote.', {
        jsx: () => B3AddToQuoteTip({
          gotoQuoteDraft: () => gotoQuoteDraft(setOpenPage),
        }),
        isClose: true,
      })
    } catch (e) {
      console.log(e)
    } finally {
      removeLoadding()
    }
  }

  return {
    addToQuote,
    addLoadding,
  }
}

export {
  addQuoteToProduct,
  addQuoteToCart,
  addLoadding,
  removeElement,
}
