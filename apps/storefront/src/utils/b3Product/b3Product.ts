import { v1 as uuid } from 'uuid'

import {
  getProxyInfo,
  searchB2BProducts,
  searchBcProducts,
} from '@/shared/service/b2b'
import { setEnteredInclusive, store } from '@/store'
import {
  AdjustersPrice,
  AllOptionProps,
  ALlOptionValue,
  BcCalculatedPrice,
  Calculateditems,
  CalculatedOptions,
  OptionValue,
  Product,
  Variant,
} from '@/types/products'
import {
  ShoppingListProductItem,
  ShoppingListProductItemModifiers,
} from '@/types/shoppingList'
import {
  B3LStorage,
  B3SStorage,
  getDefaultCurrencyInfo,
  storeHash,
} from '@/utils'

import {
  conversionProductsList,
  ListItemProps,
  ProductInfoProps,
} from './shared/config'
import getTaxRate from './b3TaxRate'

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

interface NewOptionProps {
  optionId: string
  optionValue: number
}

interface ProductOption {
  optionId: number
  optionValue: number
}

interface ProductOptionString {
  optionId: string
  optionValue: string
}

interface ProductInfo extends Variant {
  quantity: number
  productsSearch: ShoppingListProductItem
  optionSelections?: ProductOptionString[]
}

export interface LineItems {
  quantity: number
  productId: number
  optionSelections?: ProductOption[]
  sku?: string
  variantId?: number
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

    const companyId =
      B3SStorage.get('B3CompanyInfo')?.id || B3SStorage.get('salesRepCompanyId')
    const customerGroupId = B3SStorage.get('B3CustomerInfo')?.customerGroupId
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

    item.node.baseAllPrice = productPrice.toFixed(2)
    item.node.baseAllPricetax = productTax.toFixed(2)
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
    const optionList = JSON.parse(node?.optionList || '[]')

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
        const flag = optionList.some(
          (item: CustomFieldItems) =>
            item.option_id.includes(picklist.id) && item.option_value
        )
        if (flag) {
          picklist.option_values.forEach((list: Partial<ALlOptionValue>) => {
            const picklistProductId: number = list?.value_data?.product_id || 0
            if (picklistProductId) currentPicklistIds.push(picklistProductId)
            if (!picklistIds.includes(picklistProductId)) {
              picklistIds.push(picklistProductId)
            }
          })
        }
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
  isB2BUser: boolean
) => {
  try {
    const { currency_code: currencyCode } = getDefaultCurrencyInfo()
    if (listProducts.length > 0) {
      const productIds: number[] = []
      listProducts.forEach((item) => {
        const { node } = item
        if (!productIds.includes(node.productId)) {
          productIds.push(node.productId)
        }
      })
      const companyId =
        B3SStorage.get('B3CompanyInfo')?.id ||
        B3SStorage.get('salesRepCompanyId')
      const customerGroupId = B3SStorage.get('B3CustomerInfo')?.customerGroupId

      const getProducts = isB2BUser ? searchB2BProducts : searchBcProducts

      const { productsSearch } = await getProducts({
        productIds,
        currencyCode,
        companyId,
        customerGroupId,
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
  } catch (error) {
    console.log(error, 'error')
  }
  return undefined
}

const getDateValuesArray = (id: number, value: number) => {
  const data = new Date(value * 1000)
  const year = data.getFullYear()
  const month = data.getMonth() + 1
  const day = data.getDate()
  return [
    {
      option_id: id,
      value_id: month,
    },
    {
      option_id: id,
      value_id: year,
    },
    {
      option_id: id,
      value_id: day,
    },
  ]
}

const calculatedDate = (
  newOption: NewOptionProps,
  itemOption: Partial<AllOptionProps>
) => {
  let date = []
  const dateTypes = ['year', 'month', 'day']
  const isIncludeDate = (date: string) => newOption.optionId.includes(date)
  if (
    isIncludeDate(dateTypes[0]) ||
    isIncludeDate(dateTypes[1]) ||
    isIncludeDate(dateTypes[2])
  ) {
    date = [
      {
        option_id: itemOption?.id ? +itemOption.id : 0,
        value_id: +newOption.optionValue,
      },
    ]
  } else {
    const data = new Date(+newOption.optionValue * 1000)
    const year = data.getFullYear()
    const month = data.getMonth() + 1
    const day = data.getDate()
    date = [
      {
        option_id: itemOption?.id ? +itemOption.id : 0,
        value_id: month,
      },
      {
        option_id: itemOption?.id ? +itemOption.id : 0,
        value_id: year,
      },
      {
        option_id: itemOption?.id ? +itemOption.id : 0,
        value_id: day,
      },
    ]
  }

  return date
}

const getCalculatedParams = (
  optionList: CustomFieldItems[],
  variantItem: Partial<Variant>,
  allOptions: Partial<AllOptionProps>[] = []
): Partial<Calculateditems>[] | [] => {
  if (variantItem) {
    const arr: Partial<CalculatedOptions>[] = []
    const date: Partial<CalculatedOptions>[] = []

    ;(optionList || []).forEach((option: CustomFieldItems) => {
      const newOption = {
        optionId: option?.option_id || option.optionId,
        optionValue: option?.option_value || option.optionValue,
      }
      const itemOption = (allOptions || []).find(
        (select: Partial<AllOptionProps>) =>
          `${newOption.optionId}`.includes(`${select?.id}`) &&
          ((select.type !== 'text' && select.option_values?.length) ||
            (select.type === 'date' && newOption.optionValue))
      )
      if (itemOption && newOption.optionValue) {
        if (itemOption.type === 'date' && +newOption.optionValue) {
          date.push(...calculatedDate(newOption, itemOption))
        } else {
          arr.push({
            option_id: itemOption?.id ? +itemOption.id : 0,
            value_id: +newOption.optionValue,
          })
        }
      }
    })

    return [
      {
        product_id: variantItem.product_id,
        variant_id: variantItem.variant_id,
        options: [...arr, ...date],
      },
    ]
  }

  return []
}

const getBulkPrice = (calculatedPrices: any, qty: number) => {
  const { calculated_price: calculatedPrice, bulk_pricing: bulkPrices } =
    calculatedPrices

  const calculatedTaxPrice = calculatedPrice.tax_inclusive
  const calculatedNoTaxPrice = calculatedPrice.tax_exclusive
  let enteredPrice = calculatedPrice.as_entered
  const enteredInclusive = calculatedPrice.entered_inclusive
  store.dispatch(setEnteredInclusive(enteredInclusive))
  B3SStorage.set('enteredInclusiveTax', enteredInclusive)

  const tax = (calculatedTaxPrice - calculatedNoTaxPrice).toFixed(2)

  const taxRate = +(+tax / calculatedNoTaxPrice).toFixed(2)

  let finalDiscount = 0
  let itemTotalTaxPrice = 0
  let singlePrice = 0
  bulkPrices.forEach(
    ({
      minimum,
      maximum,
      discount_type: discountType,
      discount_amount: bulkPrice,
    }: // tax_discount_amount: taxDiscountAmount,
    any) => {
      // const taxExclusive = taxDiscountAmount?.tax_exclusive || 0
      // const taxInclusive = taxDiscountAmount?.tax_inclusive || 0
      // const newPrice = isTax ? tax : bulkPrice

      if (qty >= minimum && qty <= (maximum || qty)) {
        switch (discountType) {
          case 'fixed':
            // price -= +basePrice - newPrice
            finalDiscount = 0
            enteredPrice = bulkPrice
            break
          case 'percent':
            // basePrice *= newPrice / 100
            // price -= +basePrice
            finalDiscount = enteredPrice * +(bulkPrice / 100).toFixed(2)
            break
          case 'price':
            finalDiscount = bulkPrice
            break
          default:
            break
        }
      }
    }
  )

  if (finalDiscount > 0) {
    enteredPrice -= finalDiscount
  }

  if (enteredInclusive) {
    itemTotalTaxPrice = enteredPrice
    singlePrice = enteredPrice / (1 + taxRate)
  } else {
    singlePrice = enteredPrice
    itemTotalTaxPrice = enteredPrice * (1 + taxRate)
  }

  const taxPrice = singlePrice * taxRate

  const itemPrice = !enteredInclusive ? singlePrice : itemTotalTaxPrice

  return {
    taxPrice,
    itemPrice,
  }
}

interface CalculatedProductPrice {
  optionList: CustomFieldItems[]
  productsSearch: Partial<Product>
  sku: string
  qty: number
}

const getCustomerGroupId = () => {
  let customerGroupId = 0
  const B3CustomerInfo = B3SStorage.get('B3CustomerInfo')
  if (B3CustomerInfo && Object.keys(B3CustomerInfo).length !== 0) {
    customerGroupId = B3CustomerInfo.customerGroupId
  }
  return customerGroupId
}

/**
 * Calculate price for a product.
 *
 * @deprecated Use the new {@link calculateProductsPrice} function instead.
 */
const getCalculatedProductPrice = async (
  { optionList, productsSearch, sku, qty }: CalculatedProductPrice,
  calculatedValue?: CustomFieldItems
) => {
  const { variants = [] } = productsSearch

  const variantItem = variants.find(
    (item: Partial<Variant>) => item.sku?.toUpperCase() === sku.toUpperCase()
  )

  if (variantItem) {
    const items = getCalculatedParams(
      optionList,
      variantItem,
      productsSearch?.allOptions || []
    )
    const channelId = B3SStorage.get('B3channelId')
    const customerGroupId = getCustomerGroupId()

    const data = {
      channel_id: channelId,
      currency_code: getDefaultCurrencyInfo().currency_code,
      items,
      customer_group_id: customerGroupId,
    }

    let calculatedData = []

    if (calculatedValue) {
      calculatedData = [calculatedValue]
    } else {
      const res = await getProxyInfo({
        storeHash,
        method: 'post',
        url: '/v3/pricing/products',
        data,
      })

      calculatedData = res.data
    }

    const { taxPrice, itemPrice } = getBulkPrice(calculatedData[0], qty)

    const quoteListitem = {
      node: {
        id: uuid(),
        variantSku: variantItem.sku,
        variantId: variantItem.variant_id,
        productsSearch,
        primaryImage: variantItem.image_url,
        productName: productsSearch.name,
        quantity: +qty,
        optionList: JSON.stringify(optionList),
        productId: variantItem.product_id,
        basePrice: itemPrice.toFixed(2),
        taxPrice: taxPrice.toFixed(2),
        calculatedValue: calculatedData[0],
      },
    }

    return quoteListitem
  }

  return ''
}
const formatOptionsSelections = (
  options: ProductOption[],
  allOptions: Partial<AllOptionProps>[]
) =>
  options.reduce((accumulator: CalculatedOptions[], option) => {
    const matchedOption = allOptions.find(({ id, type, option_values }) => {
      if (option.optionId === id) {
        if (
          (type !== 'text' && option_values?.length) ||
          (type === 'date' && option.optionValue)
        ) {
          return true
        }
      }
      return false
    })

    if (matchedOption) {
      if (matchedOption.type === 'date') {
        const id = matchedOption.id ? +matchedOption.id : 0
        accumulator.push(...getDateValuesArray(id, option.optionValue))
      } else {
        accumulator.push({
          option_id: matchedOption.id ? +matchedOption.id : 0,
          value_id: option.optionValue,
        })
      }
    }

    return accumulator
  }, [])
const formatLineItemsToGetPrices = (
  items: LineItems[],
  productsSearch: ShoppingListProductItem[]
) =>
  items.reduce(
    (
      formatedLineItems: {
        items: Calculateditems[]
        variants: ProductInfo[]
      },
      { optionSelections = [], productId, sku, variantId, quantity }
    ) => {
      const selectedProduct = productsSearch.find(({ id }) => id === productId)
      const variantItem = selectedProduct?.variants?.find(
        ({ sku: skuResult, variant_id: variantIdResult }) =>
          sku === skuResult || variantIdResult === variantId
      )

      if (!variantItem || !selectedProduct) {
        return formatedLineItems
      }
      const { allOptions = [] } = selectedProduct

      const options = formatOptionsSelections(optionSelections, allOptions)

      formatedLineItems.items.push({
        product_id: variantItem.product_id,
        variant_id: variantItem.variant_id,
        options,
      })
      formatedLineItems.variants.push({
        ...variantItem,
        quantity,
        productsSearch: selectedProduct,
        optionSelections: optionSelections.map(({ optionId, optionValue }) => ({
          optionId: `attribute[${optionId}]`,
          optionValue: `${optionValue}`,
        })),
      })
      return formatedLineItems
    },
    { items: [], variants: [] }
  )
const calculateProductsPrice = async (
  lineItems: LineItems[],
  products: ShoppingListProductItem[],
  calculatedValue: CustomFieldItems[] = []
) => {
  let calculatedPrices = calculatedValue
  const { variants, items } = formatLineItemsToGetPrices(lineItems, products)

  // check if it's included calculatedValue
  // if not, prepare items array to get prices by `/v3/pricing/products` endpoint
  // then fetch them
  if (calculatedValue.length === 0) {
    const data = {
      channel_id: B3SStorage.get('B3channelId'),
      currency_code: getDefaultCurrencyInfo().currency_code,
      customer_group_id: getCustomerGroupId(),
      items,
    }
    const res = await getProxyInfo({
      storeHash,
      method: 'post',
      url: '/v3/pricing/products',
      data,
    })
    calculatedPrices = res.data
  }

  // create quote array struture and return it
  return calculatedPrices.map((calculatedPrice, index) => {
    const {
      productsSearch,
      quantity,
      optionSelections,
      sku: variantSku,
      variant_id: variantId,
      image_url: primaryImage,
      product_id: productId,
    } = variants[index]
    const { taxPrice, itemPrice } = getBulkPrice(calculatedPrice, quantity)
    return {
      node: {
        id: uuid(),
        variantSku,
        variantId,
        productsSearch,
        primaryImage,
        productName: productsSearch.name,
        quantity,
        optionList: JSON.stringify(optionSelections),
        productId,
        basePrice: itemPrice.toFixed(2),
        taxPrice: taxPrice.toFixed(2),
        calculatedValue: calculatedPrice,
      },
    }
  })
}

const calculateProductListPrice = async (
  products: Partial<Product>[],
  type = '1'
) => {
  try {
    let isError = false
    let i = 0
    let itemsOptions: Partial<Calculateditems>[] | [] = []
    while (i < products.length && !isError) {
      let newSelectOptionList = []
      let allOptions: Partial<AllOptionProps>[] = []
      let variants: Partial<Variant>[] = []
      let variantId = 0
      let modifiers: Partial<ShoppingListProductItemModifiers>[] = []
      let optionsV3: Partial<ShoppingListProductItemModifiers>[] = []

      if (type === '1') {
        newSelectOptionList = products[i].newSelectOptionList
        allOptions = products[i]?.allOptions || []
        variants = products[i]?.variants || []
        variantId = products[i].variantId
        modifiers = products[i]?.modifiers || []
        optionsV3 = products[i]?.optionsV3 || []
      } else if (type === '2') {
        newSelectOptionList = JSON.parse(products[i]?.node?.optionList) || []
        allOptions = products[i]?.node?.productsSearch?.allOptions || []
        variants = products[i]?.node?.productsSearch?.variants || []
        variantId = products[i].node.variantId
        modifiers = products[i]?.node?.productsSearch?.modifiers || []
        optionsV3 = products[i]?.node?.productsSearch?.optionsV3 || []
      }

      let allOptionsArr: Partial<AllOptionProps>[] = allOptions

      if (!allOptionsArr.length) {
        allOptionsArr = [...modifiers, ...optionsV3]
      }

      i += 1

      const variantItem = variants.find(
        (item: Partial<Variant>) => item.variant_id === +variantId
      )

      if (variantItem) {
        const items =
          getCalculatedParams(
            newSelectOptionList,
            variantItem,
            allOptionsArr || []
          ) || []
        itemsOptions = [...itemsOptions, ...items]
      } else {
        isError = true
      }
    }

    if (isError) {
      return products
    }

    const channelId = B3SStorage.get('B3channelId')

    const customerGroupId = getCustomerGroupId()

    const data = {
      channel_id: channelId,
      currency_code: getDefaultCurrencyInfo().currency_code,
      items: itemsOptions,
      customer_group_id: customerGroupId,
    }

    const res = await getProxyInfo({
      storeHash,
      method: 'post',
      url: '/v3/pricing/products',
      data,
    })

    const { data: calculatedData } = res

    products.forEach((product: Partial<Product>, index: number) => {
      let qty = 0

      if (type === '1') {
        qty = product?.quantity ? +product.quantity : 0
      } else {
        qty = product?.node?.quantity ? +product.node.quantity : 0
      }

      const { taxPrice, itemPrice } = getBulkPrice(calculatedData[index], qty)

      if (type === '1') {
        product.basePrice = itemPrice.toFixed(2)
        product.taxPrice = taxPrice.toFixed(2)
        product.tax = taxPrice.toFixed(2)
        product.calculatedValue = calculatedData[index]
      } else if (type === '2') {
        product.node.basePrice = itemPrice.toFixed(2)
        product.node.taxPrice = taxPrice.toFixed(2)
        product.node.tax = taxPrice.toFixed(2)
        product.node.calculatedValue = calculatedData[index]
      }
    })
    return products
  } catch (error) {
    console.log(error)
    return []
  }
}

const setModifierQtyPrice = async (
  product: CustomFieldItems,
  qty: number,
  isRequest = true
) => {
  try {
    const { productsSearch, optionList, variantSku, calculatedValue } = product

    let newProduct: CustomFieldItems | string = {}

    if (isRequest) {
      newProduct = await getCalculatedProductPrice(
        {
          productsSearch,
          optionList: JSON.parse(optionList),
          sku: variantSku,
          qty,
        },
        calculatedValue
      )
    } else {
      newProduct = getCalculatedProductPrice(
        {
          productsSearch,
          optionList: JSON.parse(optionList),
          sku: variantSku,
          qty,
        },
        calculatedValue
      )
    }

    if (newProduct && (newProduct as CustomFieldItems)?.node?.id) {
      ;(newProduct as CustomFieldItems).node.id = product.id

      return (newProduct as CustomFieldItems).node
    }

    return product
  } catch (e) {
    console.log(e)
    return product
  }
}

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

const addQuoteDraftProducts = (products: CustomFieldItems[]) => {
  const b2bQuoteDraftList = B3LStorage.get('b2bQuoteDraftList') || []
  if (b2bQuoteDraftList.length === 0) {
    B3LStorage.set('b2bQuoteDraftList', products)
    return
  }
  if (products.length) {
    products.forEach((quoteProduct: CustomFieldItems) => {
      const optionList = JSON.parse(quoteProduct.node.optionList)
      const productIndex = b2bQuoteDraftList.findIndex(
        (item: CustomFieldItems) => {
          const oldOptionList = JSON.parse(item.node.optionList)
          const isAdd =
            oldOptionList.length > optionList.length
              ? compareOption(oldOptionList, optionList)
              : compareOption(optionList, oldOptionList)

          return item.node.variantSku === quoteProduct.node.variantSku && isAdd
        }
      )

      if (productIndex !== -1) {
        b2bQuoteDraftList[productIndex].node.quantity +=
          quoteProduct.node.quantity
        if (quoteProduct.node?.calculatedValue) {
          b2bQuoteDraftList[productIndex].node.calculatedValue =
            quoteProduct.node.calculatedValue
        }
      } else {
        b2bQuoteDraftList.push(quoteProduct)
      }
    })
  }

  B3LStorage.set('b2bQuoteDraftList', b2bQuoteDraftList)
}

const validProductQty = (products: CustomFieldItems) => {
  const b2bQuoteDraftList = B3LStorage.get('b2bQuoteDraftList') || []

  let canAdd = true
  products.forEach((product: CustomFieldItems) => {
    const index = b2bQuoteDraftList.findIndex(
      (item: QuoteListitemProps) =>
        item?.node?.variantSku === product.node.variantSku
    )
    const optionList = JSON.parse(product.node.optionList) || []

    if (index !== -1) {
      const oldOptionList = JSON.parse(b2bQuoteDraftList[index].node.optionList)

      const isAdd =
        oldOptionList.length > optionList.length
          ? compareOption(oldOptionList, optionList)
          : compareOption(optionList, oldOptionList)

      if (isAdd) {
        b2bQuoteDraftList[index].node.quantity += +product.node.quantity
      }
      if (+b2bQuoteDraftList[index].node.quantity > 1000000) {
        canAdd = false
      }
    } else if (+product.node.quantity > 1000000) {
      canAdd = false
    }
  })

  return canAdd
}

const addQuoteDraftProduce = async (
  quoteListitem: CustomFieldItems,
  qty: number,
  optionList: CustomFieldItems[]
) => {
  const b2bQuoteDraftList = B3LStorage.get('b2bQuoteDraftList') || []

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

      const {
        optionList,
        productsSearch,
        variantSku,
        quantity,
        calculatedValue,
      } = b2bQuoteDraftList[index].node

      const product = await getCalculatedProductPrice(
        {
          optionList:
            typeof optionList === 'string'
              ? JSON.parse(optionList)
              : optionList,
          productsSearch,
          sku: variantSku,
          qty: quantity,
        },
        calculatedValue
      )

      if (product) {
        b2bQuoteDraftList[index].node = product.node
      }
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

const calculateIsInclude = (price: number | string, tax: number | string) => {
  const {
    global: { enteredInclusive },
  } = store.getState()

  if (enteredInclusive) return +price

  return +price + +tax
}

const getBCPrice = (basePrice: number, taxPrice: number) => {
  const {
    global: { enteredInclusive: enteredInclusiveTax, showInclusiveTaxPrice },
  } = store.getState()

  let price: number
  if (enteredInclusiveTax) {
    price = showInclusiveTaxPrice ? basePrice : basePrice - taxPrice
  } else {
    price = showInclusiveTaxPrice ? basePrice + taxPrice : basePrice
  }

  return price
}

export {
  addQuoteDraftProduce,
  addQuoteDraftProducts,
  calculateIsInclude,
  calculateProductListPrice,
  calculateProductsPrice,
  compareOption,
  getBCPrice,
  getCalculatedParams,
  getCalculatedProductPrice,
  getModifiersPrice,
  getNewProductsList,
  getProductExtraPrice,
  getQuickAddProductExtraPrice,
  setModifierQtyPrice,
  validProductQty,
}
