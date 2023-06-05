import { Dispatch, SetStateAction } from 'react'
import globalB3 from '@b3/global-b3'
import type { OpenPageState } from '@b3/hooks'
import { v1 as uuid } from 'uuid'

import { B3AddToQuoteTip } from '@/components'
import { PRODUCT_DEFAULT_IMAGE } from '@/constants'
import { searchB2BProducts, searchBcProducts } from '@/shared/service/b2b'
import { getCartInfoWithOptions } from '@/shared/service/bc'
import {
  addQuoteDraftProduce,
  addQuoteDraftProducts,
  B3SStorage,
  calculateProductListPrice,
  getCalculatedProductPrice,
  globalSnackbar,
  isAllRequiredOptionFilled,
  validProductQty,
} from '@/utils'

import { getProductOptionList, serialize } from '../../pages/pdp/PDP'
import { conversionProductsList } from '../../utils/b3Product/shared/config'

type DispatchProps = Dispatch<SetStateAction<OpenPageState>>

interface DiscountsProps {
  discountedAmount: number
  id: string
}

interface ProductOptionsProps {
  name: string
  nameId: number | string
  value: number | string
  valueId: number | string
}

interface ProductItemProps {
  brand: string | number
  couponAmount: number
  discountAmount: number
  discounts: Array<any>
  extendedListPrice: number
  extendedSalePrice: number
  giftWrapping: any
  id: string
  imageUrl: string
  isMutable: boolean
  isShippingRequired: boolean
  isTaxable: boolean
  listPrice: number
  name: string
  options: ProductOptionsProps[]
  originalPrice: number
  parentId: string | number | null
  productId: number
  quantity: number
  salePrice: number
  sku: string
  type: string
  url: string
  variantId: number
}

interface LineItemsProps {
  customItems: Array<CustomFieldItems>
  digitalItems: Array<CustomFieldItems>
  giftCertificates: Array<CustomFieldItems>
  physicalItems: ProductItemProps[]
}

type Cart =
  | 'customItems'
  | 'digitalItems'
  | 'giftCertificates'
  | 'physicalItems'

interface CartInfoProps {
  baseAmount: number
  cartAmount: number
  coupons: any
  createdTime: string
  currency: {
    code: string
    decimalPlaces: number
    name: string
    symbol: string
  }
  customerId: number
  discountAmount: number
  discounts: DiscountsProps[]
  email: string
  id: string
  isTaxIncluded: boolean
  lineItems: LineItemsProps
  locale: string
  updatedTime: string
}

const productTypes: Array<Cart> = [
  'customItems',
  'digitalItems',
  'giftCertificates',
  'physicalItems',
]

const addLoadding = (b3CartToQuote: any) => {
  const loadingDiv = document.createElement('div')
  loadingDiv.setAttribute('id', 'b2b-div-loading')
  const loadingBtn = document.createElement('div')
  loadingBtn.setAttribute('class', 'b2b-btn-loading')
  loadingDiv.appendChild(loadingBtn)
  b3CartToQuote.appendChild(loadingDiv)
}

const removeElement = (_element: CustomFieldItems) => {
  const parentElement = _element.parentNode
  if (parentElement) {
    parentElement.removeChild(_element)
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
      quoteBtn: 'add',
    },
  })
}

const getCartProducts = (lineItems: LineItemsProps) => {
  const cartProductsList: CustomFieldItems[] = []

  productTypes.forEach((type: Cart) => {
    if (lineItems[type].length > 0) {
      lineItems[type].forEach(
        (product: ProductItemProps | CustomFieldItems) => {
          if (!product.parentId) {
            cartProductsList.push(product)
          }
        }
      )
    }
  })

  return cartProductsList
}

const getOptionsList = (options: ProductOptionsProps[] | []) => {
  if (!options?.length) return []
  const option: CustomFieldItems = []
  options.forEach(({ nameId, valueId, value }) => {
    let optionValue: number | string = valueId ? `${valueId}`.toString() : value
    if (typeof valueId === 'number' && `${valueId}`.toString().length === 10) {
      optionValue = valueId
      const date = new Date(+valueId * 1000)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const day = date.getDate()
      option.push({
        optionId: `attribute[${nameId}][year]`,
        optionValue: year,
      })
      option.push({
        optionId: `attribute[${nameId}][month]`,
        optionValue: month,
      })
      option.push({
        optionId: `attribute[${nameId}][day]`,
        optionValue: day,
      })
    } else {
      option.push({
        optionId: `attribute[${nameId}]`,
        optionValue,
      })
    }
  })

  return option
}

const addProductsToDraftQuote = async (products: CustomFieldItems[]) => {
  // filter products with SKU
  const productsWithSKU = products.filter(({ sku }) => !!sku)

  const companyId =
    B3SStorage.get('B3CompanyInfo')?.id || B3SStorage.get('salesRepCompanyId')
  const customerGroupId = B3SStorage.get('B3CustomerInfo')?.customerGroupId

  // fetch data with products IDs
  const { productsSearch } = await searchB2BProducts({
    productIds: Array.from(
      new Set(products.map(({ productId }) => +productId))
    ),
    companyId,
    customerGroupId,
  })

  // convert to product search response format
  const productsListSearch: CustomFieldItems[] =
    conversionProductsList(productsSearch)

  // create products list structure compatible with quote structure
  const productsList = productsWithSKU.map((product) => {
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

    const currentProductSearch = productsListSearch.find(
      (product: any) => +product.id === +productId
    )

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
        taxPrice: salePrice - listPrice,
      },
    }

    return quoteListitem
  })

  // update prices for products list
  await calculateProductListPrice(productsList, '2')

  const isSuccess = validProductQty(productsList)
  if (isSuccess) {
    addQuoteDraftProducts(productsList)
  }

  return isSuccess
}

const addProductsFromCartToQuote = (setOpenPage: DispatchProps) => {
  const addToQuote = async () => {
    try {
      const cartInfoWithOptions: CartInfoProps | any =
        await getCartInfoWithOptions()

      if (!cartInfoWithOptions[0]) {
        globalSnackbar.error('No products in Cart.', {
          isClose: true,
        })
        return
      }

      const { lineItems } = cartInfoWithOptions[0]

      const cartProductsList = getCartProducts(lineItems)

      if (cartProductsList.length === 0) {
        globalSnackbar.error('No products being added.', {
          isClose: true,
        })
      }

      const isSuccess = await addProductsToDraftQuote(cartProductsList)
      if (isSuccess) {
        globalSnackbar.success('', {
          jsx: () =>
            B3AddToQuoteTip({
              gotoQuoteDraft: () => gotoQuoteDraft(setOpenPage),
              msg: 'Product was added to your quote.',
            }),
          isClose: true,
        })
      } else {
        globalSnackbar.error('', {
          jsx: () =>
            B3AddToQuoteTip({
              gotoQuoteDraft: () => gotoQuoteDraft(setOpenPage),
              msg: 'The quantity of each product in Quote is 1-1000000.',
            }),
          isClose: true,
        })
      }
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

const addProductFromProductPageToQuote = (setOpenPage: DispatchProps) => {
  const addToQuote = async (role: string | number, node?: HTMLElement) => {
    try {
      const productView: HTMLElement | null = node
        ? node.closest(globalB3['dom.productView'])
        : document
      if (!productView) return
      const productId = (
        productView.querySelector('input[name=product_id]') as CustomFieldItems
      )?.value
      const qty =
        (productView.querySelector('[name="qty[]"]') as CustomFieldItems)
          ?.value ?? 1
      const sku = (
        productView.querySelector('[data-product-sku]')?.innerHTML ?? ''
      ).trim()
      const form = productView.querySelector('form[data-cart-item-add]')

      const companyId =
        B3SStorage.get('B3CompanyInfo')?.id ||
        B3SStorage.get('salesRepCompanyId')
      const customerGroupId = B3SStorage.get('B3CustomerInfo')?.customerGroupId
      const fn =
        +role === 99 || +role === 100 ? searchBcProducts : searchB2BProducts

      const { productsSearch } = await fn({
        productIds: [+productId],
        companyId,
        customerGroupId,
      })

      const newProductInfo: CustomFieldItems =
        conversionProductsList(productsSearch)
      const { allOptions } = newProductInfo[0]

      const optionMap = serialize(form)

      const optionList = getProductOptionList(optionMap)

      const { isValid, message } = isAllRequiredOptionFilled(
        allOptions,
        optionList
      )
      if (!isValid) {
        globalSnackbar.error(message, {
          isClose: true,
        })
        return
      }

      const quoteListitem = await getCalculatedProductPrice({
        optionList,
        productsSearch: newProductInfo[0],
        sku,
        qty,
      })

      const newProducts: CustomFieldItems = [quoteListitem]
      const isSuccess = validProductQty(newProducts)
      if (quoteListitem && isSuccess) {
        await addQuoteDraftProduce(quoteListitem, qty, optionList || [])
        globalSnackbar.success('', {
          jsx: () =>
            B3AddToQuoteTip({
              gotoQuoteDraft: () => gotoQuoteDraft(setOpenPage),
              msg: 'Product was added to your quote.',
            }),
          isClose: true,
        })
      } else if (!isSuccess) {
        globalSnackbar.error('', {
          jsx: () =>
            B3AddToQuoteTip({
              gotoQuoteDraft: () => gotoQuoteDraft(setOpenPage),
              msg: 'The maximum purchase quantity does not exceed 1,000,000.',
            }),
          isClose: true,
        })
      } else {
        globalSnackbar.error('Price error', {
          isClose: true,
        })
      }
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
  addLoadding,
  addProductFromProductPageToQuote,
  addProductsFromCartToQuote,
  addProductsToDraftQuote,
  removeElement,
}
