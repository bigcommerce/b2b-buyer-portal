import { Dispatch, SetStateAction } from 'react'
import globalB3 from '@b3/global-b3'

import B3AddToQuoteTip from '@/components/B3AddToQuoteTip'
import { searchB2BProducts, searchBcProducts } from '@/shared/service/b2b'
import { getCart } from '@/shared/service/bc/graphql/cart'
import { store } from '@/store'
import { OpenPageState } from '@/types/hooks'
import {
  B3LStorage,
  B3SStorage,
  getActiveCurrencyInfo,
  getCookie,
  globalSnackbar,
  serialize,
} from '@/utils'
import {
  getProductOptionList,
  isAllRequiredOptionFilled,
} from '@/utils/b3AddToShoppingList'
import b2bLogger from '@/utils/b3Logger'
import {
  addQuoteDraftProduce,
  addQuoteDraftProducts,
  calculateProductsPrice,
  getCalculatedProductPrice,
  LineItems,
  validProductQty,
} from '@/utils/b3Product/b3Product'

import { conversionProductsList } from '../../utils/b3Product/shared/config'

type DispatchProps = Dispatch<SetStateAction<OpenPageState>>

interface DiscountsProps {
  discountedAmount: number
  id: string
}

interface ProductOptionsProps {
  name: string
  nameId: number
  value: number | string
  valueId: number
}

interface CustomItemProps {
  extendedListPrice: number
  id: string
  listPrice: number
  name: string
  quantity: number
  sku: string
}

interface DigitalItemProps extends CustomItemProps {
  options: ProductOptionsProps[]
  brand: string
  couponAmount: number
  discountAmount: number
  discounts: DiscountsProps[]
  extendedSalePrice: number
  imageUrl: string
  isTaxable: boolean
  originalPrice: number
  parentId?: string
  productId: number
  salePrice: number
  url: string
  variantId: number
}

interface PhysicalItemProps extends DigitalItemProps {
  giftWrapping: {
    amount: number
    message: string
    name: string
  }
  isShippingRequire: boolean
}
interface Contact {
  email: string
  name: string
}
interface GiftCertificateProps {
  amount: number
  id: string
  isTaxable: boolean
  name: string
  recipient: Contact
  sender: Contact
}

interface LineItemsProps {
  customItems: CustomItemProps[]
  digitalItems: DigitalItemProps[]
  giftCertificates: GiftCertificateProps[]
  physicalItems: PhysicalItemProps[]
}

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

const getCartProducts = (lineItems: LineItemsProps) =>
  Object.values(lineItems)
    .flat()
    .reduce(
      (accumulator, { options = [], sku, ...product }) => {
        if (!sku) {
          accumulator.noSkuProducts.push(product)
          return accumulator
        }
        if (!product.parentId) {
          accumulator.cartProductsList.push({
            ...product,
            sku,
            optionSelections: options.map(
              ({ nameId, valueId }: ProductOptionsProps) => ({
                optionId: nameId,
                optionValue: valueId,
              })
            ),
          })
        }
        return accumulator
      },
      { cartProductsList: [], noSkuProducts: [] }
    )

const addProductsToDraftQuote = async (
  products: LineItems[],
  setOpenPage: DispatchProps,
  cartId?: string
) => {
  // filter products with SKU
  const productsWithSKUOrVariantId = products.filter(
    ({ sku, variantEntityId }) => sku || variantEntityId
  )

  const companyInfoId = store.getState().company.companyInfo.id
  const salesRepCompanyId = store.getState().b2bFeatures.masqueradeCompany.id
  const companyId = companyInfoId || salesRepCompanyId
  const { customerGroupId } = store.getState().company.customer

  const { currency_code: currencyCode } = getActiveCurrencyInfo()

  // fetch data with products IDs
  const { productsSearch } = await searchB2BProducts({
    productIds: Array.from(
      new Set(
        productsWithSKUOrVariantId.map(
          ({ productEntityId }) => +productEntityId
        )
      )
    ),
    currencyCode,
    companyId,
    customerGroupId,
  })

  // get products prices
  const productsListSearch = conversionProductsList(productsSearch)
  const productsList = await calculateProductsPrice(
    productsWithSKUOrVariantId,
    productsListSearch
  )

  const isSuccess = validProductQty(productsList)
  if (isSuccess) {
    addQuoteDraftProducts(productsList)
  }

  if (isSuccess) {
    // Save the shopping cart id, used to clear the shopping cart after submitting the quote
    if (cartId) B3LStorage.set('cartToQuoteId', cartId)

    globalSnackbar.success('', {
      jsx: () =>
        B3AddToQuoteTip({
          gotoQuoteDraft: () => gotoQuoteDraft(setOpenPage),
          msg: 'Product was added to your quote.',
        }),
      isClose: true,
    })
    return
  }

  globalSnackbar.error('', {
    jsx: () =>
      B3AddToQuoteTip({
        gotoQuoteDraft: () => gotoQuoteDraft(setOpenPage),
        msg: 'The quantity of each product in Quote is 1-1000000.',
      }),
    isClose: true,
  })
}

const addProductsFromCartToQuote = (
  setOpenPage: DispatchProps,
  platform?: string
) => {
  const addToQuote = async () => {
    const entityCartId = platform === 'bigcommerce' ? null : getCookie('cartId')
    try {
      const cartInfoWithOptions: CartInfoProps | any =
        // we should get the platform parameter from wherever this function is used
        await getCart(entityCartId, platform ?? '')

      if (!cartInfoWithOptions.data.site.cart) {
        globalSnackbar.error('No products in Cart.', {
          isClose: true,
        })
        return
      }

      const { lineItems, entityId } = cartInfoWithOptions.data.site.cart

      const { cartProductsList, noSkuProducts } = getCartProducts(lineItems)

      if (noSkuProducts.length > 0) {
        globalSnackbar.error('Can not add products without SKU.', {
          isClose: true,
        })
      }

      if (cartProductsList.length === 0) {
        globalSnackbar.error('No products being added.', {
          isClose: true,
        })
      }
      if (noSkuProducts.length === cartProductsList.length) return

      await addProductsToDraftQuote(cartProductsList, setOpenPage, entityId)
    } catch (e) {
      b2bLogger.error(e)
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
      const form = productView.querySelector(
        'form[data-cart-item-add]'
      ) as HTMLFormElement

      if (!sku) {
        globalSnackbar.error('Can not add products without SKU.', {
          isClose: true,
        })

        return
      }
      const companyInfoId = store.getState().company.companyInfo.id
      const companyId = companyInfoId || B3SStorage.get('salesRepCompanyId')
      const { customerGroupId } = store.getState().company.customer
      const fn =
        +role === 99 || +role === 100 ? searchBcProducts : searchB2BProducts

      const { currency_code: currencyCode } = getActiveCurrencyInfo()

      const { productsSearch } = await fn({
        productIds: [+productId],
        companyId,
        customerGroupId,
        currencyCode,
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
              msg: 'global.notification.addProductSingular',
            }),
          isClose: true,
        })
      } else if (!isSuccess) {
        globalSnackbar.error('', {
          jsx: () =>
            B3AddToQuoteTip({
              gotoQuoteDraft: () => gotoQuoteDraft(setOpenPage),
              msg: 'global.notification.maximumPurchaseExceed',
            }),
          isClose: true,
        })
      } else {
        globalSnackbar.error('Price error', {
          isClose: true,
        })
      }
    } catch (e) {
      b2bLogger.error(e)
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
