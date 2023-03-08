import {
  useCallback,
  SetStateAction,
  Dispatch,
  useState,
  useEffect,
} from 'react'

import {
  useB3Quote,
  useMutationObservable,
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
  searchBcProducts,
} from '@/shared/service/b2b'

import {
  B3LStorage,
  addQuoteDraftProduce,
  isAllRequiredOptionFilled,
} from '@/utils'

import {
  removeCartPermissions,
} from '@/utils/b3RolePermissions'

import {
  serialize,
  getProductOptionList,
} from '../pages/pdp/PDP'

import {
  useQuoteGlobalTip,
} from './useQuoteGlobalTip'

import {
  conversionProductsList,
} from '../pages/shoppingListDetails/shared/config'

interface MutationObserverProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>,
  productQuoteEnabled: boolean,
  B3UserId: number | string,
  role: number | string,

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

const useMyQuote = ({
  setOpenPage,
  productQuoteEnabled,
  B3UserId,
  role,
}: MutationObserverProps) => {
  const [openQuickViewNum, setOpenQuickViewNum] = useState<number>(0)

  const [openTipState, setOpenTipState] = useState<OpenTipStateProps>({
    isOpen: false,
    message: '',
    variant: '',
  })

  useEffect(() => {
    const quoteDraftUserId = B3LStorage.get('quoteDraftUserId')
    if (+B3UserId !== +quoteDraftUserId) {
      B3LStorage.set('MyQuoteInfo', {})
      B3LStorage.set('b2bQuoteDraftList', [])
    }
  }, [B3UserId])

  const addLoadding = (b3MyQuote: any) => {
    const loadingDiv = document.createElement('div')
    loadingDiv.setAttribute('id', 'b2b-div-loading')
    const loadingBtn = document.createElement('div')
    loadingBtn.setAttribute('class', 'b2b-btn-loading')
    loadingDiv.appendChild(loadingBtn)
    b3MyQuote.appendChild(loadingDiv)
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

  const addToQuote = async () => {
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

      // const modifiers = productsSearch[0]?.modifiers?.filter((modifier: CustomFieldItems) => modifier.type === 'product_list_with_images') || []
      // const additionalCalculatedPrices: any = []

      // const productIds = []

      // if (modifiers.length > 0) {
      //   modifiers.forEach((modifier: CustomFieldItems) => {
      //     const optionValues = modifier.option_values
      //     const productListWithImagesVlaue = optionList.find((item: CustomFieldItems) => item.optionId.includes(modifier.id))?.optionValue || ''
      //     if (productListWithImagesVlaue) {
      //       const additionalProductsParams = optionValues.find((item: CustomFieldItems) => +item.id === +productListWithImagesVlaue)
      //       if (additionalProductsParams?.value_data?.product_id) productIds.push(additionalProductsParams.value_data.product_id)
      //     }
      //   })
      // }

      // if (productIds.length) {
      //   const fn = +role === 99 || +role === 100 ? searchBcProducts : searchB2BProducts

      //   const {
      //     productsSearch: additionalProductsSearch,
      //   } = await fn({
      //     productIds: productIds,
      //   })

      //   additionalProductsSearch.forEach((item: CustomFieldItems) => {
      //     const additionalSku = item.sku
      //     const additionalVariants = item.variants
      //     const additionalCalculatedItem = additionalVariants.find((item: CustomFieldItems) => item.sku === additionalSku)
      //     if (additionalCalculatedItem) {
      //       additionalCalculatedPrices.push({
      //         additionalCalculatedPrice: additionalCalculatedItem.bc_calculated_price.tax_exclusive,
      //         additionalCalculatedPriceTax: additionalCalculatedItem.bc_calculated_price.tax_inclusive - additionalCalculatedItem.bc_calculated_price.tax_exclusive
      //       })
      //     }
      //   })
      // }

      // console.log(additionalCalculatedPrices, additionalCalculatedPrices)

      const {
        isValid,
        message,
      } = isAllRequiredOptionFilled(allOptions, optionList)
      if (!isValid) {
        setOpenTipState({
          isOpen: true,
          message,
          variant: 'error',
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
          basePrice: variantItem.bc_calculated_price.as_entered,
          tax: variantItem.bc_calculated_price.tax_inclusive - variantItem.bc_calculated_price.tax_exclusive,
        },
      }

      addQuoteDraftProduce(quoteListitem, qty, optionList || [])

      setOpenTipState({
        isOpen: true,
        message: 'Product was added to your quote.',
        variant: 'success',
      })
    } catch (e) {
      console.log(e)
    } finally {
      removeLoadding()
    }
  }

  const quoteCallBbck = useCallback(() => {
    const b3MyQuote = document.querySelector('#b3MyQuote')
    const b2bLoading = document.querySelector('#b2b-div-loading')
    if (b3MyQuote && !b2bLoading) {
      addLoadding(b3MyQuote)
      addToQuote()
    }
  }, [])

  const cd = useCallback(() => {
    if (document.querySelectorAll(globalB3['dom.setToQuote']).length) {
      setOpenQuickViewNum(openQuickViewNum + 1)
      removeCartPermissions(role)
    }
  }, [role])

  useMutationObservable(document.documentElement, cd)

  useB3Quote(globalB3['dom.setToQuote'], quoteCallBbck, openQuickViewNum, productQuoteEnabled)

  useQuoteGlobalTip(openTipState, setOpenPage, initTip)
}

export {
  useMyQuote,
}
