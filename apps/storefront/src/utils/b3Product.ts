import { searchB2BProducts, searchBcProducts } from '@/shared/service/b2b'
import { store } from '@/store'
import { B3LStorage, B3SStorage } from '@/utils'

interface QuoteListitemProps {
  node: {
    id: number
    quantity?: number
    variantSku: number | string
    variantId: number | string
    primaryImage: number | string
    productName: number | string
    optionList: number | string
    productId: number | string
    basePrice: number | string
    productsSearch: CustomFieldItems
  }
}

interface AdditionalCalculatedPricesProps {
  [key: string]: number
}

const addQuoteDraftProduce = async (
  quoteListitem: CustomFieldItems,
  qty: number,
  optionList: CustomFieldItems[]
) => {
  const b2bQuoteDraftList = B3LStorage.get('b2bQuoteDraftList') || []

  const compareOption = (
    langList: CustomFieldItems[],
    shortList: CustomFieldItems[]
  ) => {
    let flag = true
    langList.forEach((item: CustomFieldItems) => {
      const option = shortList.find(
        (list: CustomFieldItems) => list.optionId === item.optionId
      )
      if (!option) {
        if (item?.optionValue) flag = false
      } else if (item.optionValue !== option.optionValue) flag = false
    })
    return flag
  }

  const index = b2bQuoteDraftList.findIndex(
    (item: QuoteListitemProps) =>
      item?.node?.variantSku === quoteListitem.node.variantSku
  )

  if (index !== -1) {
    // TODO optionList compare
    const oldOptionList = JSON.parse(b2bQuoteDraftList[index].node.optionList)

    const isAdd =
      oldOptionList.length > optionList.length
        ? compareOption(oldOptionList, optionList)
        : compareOption(optionList, oldOptionList)

    if (isAdd) {
      b2bQuoteDraftList[index].node.quantity += +qty
    } else {
      // const productList = await getProductPrice(optionList, quoteListitem)
      b2bQuoteDraftList.push(quoteListitem)
    }
  } else {
    // const productList = await getProductPrice(optionList, quoteListitem)
    b2bQuoteDraftList.push(quoteListitem)
  }

  B3LStorage.set('b2bQuoteDraftList', b2bQuoteDraftList)
}

const getModifiersPrice = (
  modifiers: CustomFieldItems[],
  options: CustomFieldItems
) => {
  if (!modifiers.length || !options.length) return []
  const modifierCalculatedPrices: AdditionalCalculatedPricesProps[] = []
  modifiers.forEach((modifierItem: CustomFieldItems) => {
    if (modifierItem.option_values.length) {
      const modifierOptionValues =
        options.find((option: CustomFieldItems) =>
          option.optionId.includes(modifierItem.id)
        )?.optionValue || ''
      const adjustersPrice =
        modifierItem.option_values.find(
          (item: CustomFieldItems) => +item.id === +modifierOptionValues
        )?.adjusters?.price || null
      if (adjustersPrice) {
        modifierCalculatedPrices.push({
          additionalCalculatedPrice: adjustersPrice.adjuster_value,
          additionalCalculatedPriceTax: 0,
        })
      }
    }
  })

  return modifierCalculatedPrices
}

const getProductExtraPrice = async (
  modifiers: CustomFieldItems[],
  options: CustomFieldItems,
  role: number
) => {
  if (!modifiers.length || !options.length) return []
  const modifiersItem =
    modifiers?.filter(
      (modifier: CustomFieldItems) =>
        modifier.type === 'product_list_with_images'
    ) || []
  const additionalCalculatedPrices: AdditionalCalculatedPricesProps[] = []

  const productIds: number[] = []

  if (modifiersItem.length > 0) {
    modifiersItem.forEach((modifier: CustomFieldItems) => {
      const optionValues = modifier.option_values
      const productListWithImagesVlaue =
        options.find((item: CustomFieldItems) =>
          item.optionId.includes(modifier.id)
        )?.optionValue || ''
      if (productListWithImagesVlaue) {
        const additionalProductsParams = optionValues.find(
          (item: CustomFieldItems) => +item.id === +productListWithImagesVlaue
        )
        if (additionalProductsParams?.value_data?.product_id)
          productIds.push(additionalProductsParams.value_data.product_id)
      }
    })
  }

  if (productIds.length) {
    const currentState = store.getState()
    const fn =
      +role === 99 || +role === 100 ? searchBcProducts : searchB2BProducts
    const companyInfoId = currentState.company.companyInfo.id
    const companyId = companyInfoId || B3SStorage.get('salesRepCompanyId')
    const { customerGroupId } = currentState.company.customer

    const { productsSearch: additionalProductsSearch } = await fn({
      productIds,
      companyId,
      customerGroupId,
    })

    additionalProductsSearch.forEach((item: CustomFieldItems) => {
      const additionalSku = item.sku
      const additionalVariants = item.variants
      const additionalCalculatedItem = additionalVariants.find(
        (item: CustomFieldItems) => item.sku === additionalSku
      )
      if (additionalCalculatedItem) {
        additionalCalculatedPrices.push({
          additionalCalculatedPrice:
            additionalCalculatedItem.bc_calculated_price.tax_exclusive,
          additionalCalculatedPriceTax:
            additionalCalculatedItem.bc_calculated_price.tax_inclusive -
            additionalCalculatedItem.bc_calculated_price.tax_exclusive,
        })
      }
    })
  }
  return additionalCalculatedPrices
}

const getQuickAddProductExtraPrice = (
  allOptions: CustomFieldItems[],
  newSelectOptionList: CustomFieldItems,
  additionalProducts: any
) => {
  const productListWithImages = allOptions.filter(
    (item: CustomFieldItems) => item.type === 'product_list_with_images'
  )

  const additionalCalculatedPrices: CustomFieldItems[] = []

  if (productListWithImages.length) {
    productListWithImages.forEach((option: CustomFieldItems) => {
      const optionId = option.id
      const optionValues = option?.option_values || []
      const productListWithImagesValue =
        newSelectOptionList.find((item: CustomFieldItems) =>
          item.optionId.includes(optionId)
        )?.optionValue || ''
      if (productListWithImagesValue) {
        const productId =
          optionValues.find(
            (item: CustomFieldItems) =>
              item.id.toString() === productListWithImagesValue
          )?.value_data?.product_id || ''
        if (additionalProducts[productId]) {
          const additionalSku = additionalProducts[productId].sku
          const additionalVariants = additionalProducts[productId].variants
          const additionalCalculatedItem = additionalVariants.find(
            (item: CustomFieldItems) => item.sku === additionalSku
          )
          if (additionalCalculatedItem) {
            additionalCalculatedPrices.push({
              additionalCalculatedPrice:
                additionalCalculatedItem.calculated_price,
              additionalCalculatedPriceTax:
                additionalCalculatedItem.bc_calculated_price.tax_inclusive -
                additionalCalculatedItem.bc_calculated_price.tax_exclusive,
            })
          }
        }
      }
    })
  }

  return additionalCalculatedPrices
}

export {
  // getProductPrice,
  addQuoteDraftProduce,
  getModifiersPrice,
  getProductExtraPrice,
  getQuickAddProductExtraPrice,
}
