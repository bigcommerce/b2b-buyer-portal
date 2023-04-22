import { searchB2BProducts, searchBcProducts } from '@/shared/service/b2b'
import {
  AdjustersPrice,
  AllOptionProps,
  ALlOptionValue,
  BcCalculatedPrice,
  OptionValue,
  Product,
  Variant,
} from '@/types/products'
import { B3LStorage, getDefaultCurrencyInfo } from '@/utils'

import {
  conversionProductsList,
  ListItemProps,
  ProductInfoProps,
} from './shared/config'
import getTaxRate from './b3TaxRate'

// import {
//   ShoppingListProductItemModifiers,
// } from '@/types/shoppingList'

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
    const fn =
      +role === 99 || +role === 100 ? searchBcProducts : searchB2BProducts

    const { productsSearch: additionalProductsSearch } = await fn({
      productIds,
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

const getListModifierPrice = (
  allOptions: Partial<AllOptionProps>[],
  node: ProductInfoProps
) => {
  const optionList = JSON.parse(node?.optionList || '[]')
  const modifierPrices: AdjustersPrice[] = []
  if (optionList.length) {
    optionList.forEach((option: CustomFieldItems) => {
      const itemOption = allOptions.find((item: Partial<AllOptionProps>) =>
        option.option_id.includes(item.id)
      )
      if (
        itemOption &&
        itemOption?.option_values &&
        itemOption.option_values.length
      ) {
        const optionValues = itemOption.option_values.find(
          (optionValue: Partial<OptionValue>) =>
            (optionValue?.id ? +optionValue.id : 0) === +option.option_value
        )
        if (
          optionValues &&
          optionValues?.adjusters &&
          optionValues?.adjusters?.price
        ) {
          const { price } = optionValues.adjusters
          if (price) {
            modifierPrices.push(price)
          }
        }
      }
    })
  }

  return modifierPrices
}

const setItemProductPrice = (newListProducts: ListItemProps[]) => {
  newListProducts.forEach((item: ListItemProps) => {
    const {
      node: {
        modifierPrices = [],
        currentProductPrices,
        extraProductPrices = [],
        taxClassId,
      },
    } = item

    const rate = getTaxRate(taxClassId)

    let singleCurrentPrice = currentProductPrices?.tax_exclusive || 0
    let singleAllTax = 0
    let singleextraProductPrice = 0

    if (modifierPrices.length) {
      modifierPrices.forEach((modifierPrice) => {
        switch (modifierPrice?.adjuster) {
          case 'relative':
            singleCurrentPrice += modifierPrice.adjuster_value
            break
          default:
            singleCurrentPrice +=
              (modifierPrice.adjuster_value * singleCurrentPrice) / 100
            break
        }
      })
    }

    if (extraProductPrices.length) {
      extraProductPrices.forEach((extraProductPrice) => {
        singleextraProductPrice +=
          extraProductPrice.tax_exclusive * ((100 + rate) / 100)
        singleAllTax += extraProductPrice.tax_exclusive * (rate / 100)
      })
    }
    const productPrice =
      singleCurrentPrice * ((100 + rate) / 100) + singleextraProductPrice
    const productTax = singleCurrentPrice * (rate / 100) + singleAllTax

    item.node.basePrice = productPrice.toFixed(2)
    item.node.basePricetax = productTax.toFixed(2)
  })
}

const getExtraProductPricesProducts = async (
  isB2BUser: boolean,
  listProducts: ListItemProps[],
  picklistIds: number[]
) => {
  const getProducts = isB2BUser ? searchB2BProducts : searchBcProducts
  const { currency_code: currencyCode } = getDefaultCurrencyInfo()
  const { productsSearch: picklistProductsSearch } = await getProducts({
    productIds: picklistIds,
    currencyCode,
  })
  const newpicklistProducts: Partial<Product>[] = conversionProductsList(
    picklistProductsSearch
  )

  listProducts.forEach((item) => {
    const { node } = item

    const extraProductPrices: BcCalculatedPrice[] = []
    if (node?.picklistIds?.length) {
      node?.picklistIds.forEach((picklistId: number) => {
        const picklistItem = newpicklistProducts.find(
          (product: Partial<Product>) =>
            product?.id && +product.id === +picklistId
        )
        if (
          picklistItem &&
          picklistItem?.variants?.length &&
          picklistItem.variants[0]?.bc_calculated_price
        ) {
          extraProductPrices.push(picklistItem.variants[0]?.bc_calculated_price)
        }
      })
    }
    node.extraProductPrices = extraProductPrices
  })

  return listProducts
}

const addTaxProductPrices = (
  listProducts: ListItemProps[],
  newProductsSearch: Partial<Product>[],
  picklistIds: number[]
) => {
  listProducts.forEach((item) => {
    const { node } = item

    const productInfo: Partial<Product> =
      newProductsSearch.find((search: Partial<Product>) => {
        const { id: productId } = search

        return node.productId === productId
      }) || {}

    // gets the associated product id
    const currentPicklistIds: number[] = []
    if (productInfo?.allOptions && productInfo?.allOptions.length) {
      const picklist = productInfo.allOptions.find(
        (item: Partial<AllOptionProps>) =>
          item.type === 'product_list_with_images'
      )
      if (picklist && picklist?.option_values?.length) {
        picklist.option_values.forEach((list: Partial<ALlOptionValue>) => {
          const picklistProductId: number = list?.value_data?.product_id || 0
          if (picklistProductId) currentPicklistIds.push(picklistProductId)
          if (!picklistIds.includes(picklistProductId)) {
            picklistIds.push(picklistProductId)
          }
        })
      }
    }
    // get modifier price
    if (productInfo?.variants?.length && productInfo?.allOptions?.length) {
      const modifierPrices = getListModifierPrice(productInfo.allOptions, node)
      node.modifierPrices = modifierPrices
    }

    // get current  price and tax price
    const variantItem = productInfo?.variants?.find(
      (item: Partial<Variant>) => item.sku === node.variantSku
    )
    if (variantItem) {
      node.currentProductPrices = variantItem.bc_calculated_price
    }
    node.taxClassId = productInfo.taxClassId

    node.picklistIds = currentPicklistIds

    node.productsSearch = productInfo || {}
  })
}

const getNewProductsList = async (
  listProducts: ListItemProps[],
  isB2BUser: boolean,
  companyId: number | string
) => {
  const { currency_code: currencyCode } = getDefaultCurrencyInfo()
  if (listProducts.length > 0) {
    const productIds: number[] = []
    listProducts.forEach((item) => {
      const { node } = item
      if (!productIds.includes(node.productId)) {
        productIds.push(node.productId)
      }
    })
    const getProducts = isB2BUser ? searchB2BProducts : searchBcProducts

    const { productsSearch } = await getProducts({
      productIds,
      currencyCode,
      companyId,
    })

    const newProductsSearch: Partial<Product>[] =
      conversionProductsList(productsSearch)

    const picklistIds: number[] = []

    // add modifier price,  current  price and tax price, get the associated product id
    addTaxProductPrices(listProducts, newProductsSearch, picklistIds)

    let newListProducts: ListItemProps[] = listProducts

    // Get a collection of related products
    if (picklistIds.length) {
      newListProducts = await getExtraProductPricesProducts(
        isB2BUser,
        listProducts,
        picklistIds
      )
    }

    setItemProductPrice(newListProducts)

    return newListProducts
  }
  return undefined
}

export {
  // getProductPrice,
  addQuoteDraftProduce,
  getModifiersPrice,
  getNewProductsList,
  getProductExtraPrice,
  getQuickAddProductExtraPrice,
}
