import {
  useCallback,
  SetStateAction,
  Dispatch,
  useState,
} from 'react'

import {
  useB3CartToQuote,
} from '@b3/hooks'

import globalB3 from '@b3/global-b3'

import type {
  OpenPageState,
} from '@b3/hooks'

import {
  v1 as uuid,
} from 'uuid'
import {
  searchB2BProducts,
} from '@/shared/service/b2b'

import {
  getCartInfoWithOptions,
} from '@/shared/service/bc'

import {
  addQuoteDraftProduce,
} from '@/utils'

import {
  PRODUCT_DEFAULT_IMAGE,
} from '@/constants'

import {
  useQuoteGlobalTip,
} from './useQuoteGlobalTip'

import {
  conversionProductsList,
} from '../pages/shoppingListDetails/shared/config'

interface MutationObserverProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>,
  cartQuoteEnabled: boolean,
}

const removeElement = (_element: CustomFieldItems) => {
  const _parentElement = _element.parentNode
  if (_parentElement) {
    _parentElement.removeChild(_element)
  }
}

interface OpenTipStateProps {
  isOpen: boolean,
  message: string,
  variant: string,
}

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

const useCartToQuote = ({
  setOpenPage,
  cartQuoteEnabled,
}: MutationObserverProps) => {
  const [openTipState, setOpenTipState] = useState<OpenTipStateProps>({
    isOpen: false,
    message: '',
    variant: '',
  })

  const addLoadding = (b3CartToQuote: any) => {
    const loadingDiv = document.createElement('div')
    loadingDiv.setAttribute('id', 'b2b-div-loading')
    const loadingBtn = document.createElement('div')
    loadingBtn.setAttribute('class', 'b2b-btn-loading')
    loadingDiv.appendChild(loadingBtn)
    b3CartToQuote.appendChild(loadingDiv)
  }

  const removeLoadding = () => {
    const b2bLoading = document.querySelector('#b2b-div-loading')
    if (b2bLoading) removeElement(b2bLoading)
  }

  const initTip = () => {
    setOpenTipState({
      isOpen: false,
      message: '',
      variant: '',
    })
  }

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

      const {
        lineItems,
      } = cartInfoWithOptions[0]

      const cartProductsList = getCartProducts(lineItems)

      if (cartProductsList.length === 0) {
        setOpenTipState({
          isOpen: true,
          message: 'No products being added.',
          variant: 'error',
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

      setOpenTipState({
        isOpen: true,
        message: 'Products were added to your quote.',
        variant: 'success',
      })
    } catch (e) {
      console.log(e)
    } finally {
      removeLoadding()
    }
  }

  const quoteCallBbck = useCallback(() => {
    const b3CartToQuote = document.querySelector('#b3CartToQuote')

    const b2bLoading = document.querySelector('#b2b-div-loading')
    if (b3CartToQuote && !b2bLoading) {
      addLoadding(b3CartToQuote)
      addToQuote()
    }
  }, [])

  useB3CartToQuote(globalB3['dom.cartActions.container'], quoteCallBbck, cartQuoteEnabled)

  useQuoteGlobalTip(openTipState, setOpenPage, initTip)
}

export {
  useCartToQuote,
}
