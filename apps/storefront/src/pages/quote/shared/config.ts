import {
  B3LStorage,
} from '@/utils'

interface AdditionalCalculatedPricesProps {
  additionalCalculatedPrice: number
  additionalCalculatedPriceTax: number
}

export interface QuoteListitemProps {
  node: {
    variantSku: number | string,
    variantId: number | string,
    primaryImage: string,
    productName: string,
    optionList: string,
    productId: number | string,
    basePrice: number,
    productsSearch: CustomFieldItems
    quantity: number,
    tax: number,
    additionalCalculatedPrices: AdditionalCalculatedPricesProps[],
    // additionalCalculatedPrice?: number
    // additionalCalculatedPriceTax?: number
  }
}

export interface ProductInfoProps {
  basePrice: number | string,
  baseSku: string,
  createdAt: number,
  discount: number | string,
  enteredInclusive: boolean,
  id: number | string,
  itemId: number,
  optionList: string,
  primaryImage: string,
  productId: number,
  productName: string,
  productUrl: string,
  quantity: number | string,
  tax: number | string,
  updatedAt: number,
  variantId: number,
  variantSku: string,
  productsSearch: CustomFieldItems,
}

interface Summary {
  subtotal: number,
  shipping: number,
  tax: number,
  grandTotal: number,
}

export const compareOption = (langList: CustomFieldItems[], shortList:CustomFieldItems[]) => {
  let flag = true
  langList.forEach((item: CustomFieldItems) => {
    const option = shortList.find((list: CustomFieldItems) => list.optionId === item.optionId)
    if (!option) {
      if (item?.optionValue) flag = false
    } else if (item.optionValue !== option.optionValue) flag = false
  })
  return flag
}

const defaultSummary: Summary = {
  subtotal: 0,
  shipping: 0,
  tax: 0,
  grandTotal: 0,
}

const priceCalc = (price: number) => parseFloat(price.toFixed(2))

export const addPrice = () => {
  const productList = B3LStorage.get('b2bQuoteDraftList') || []
  const newQuoteSummary = productList.reduce((summary: Summary, product: CustomFieldItems) => {
    const {
      basePrice,
      tax: productTax,
      quantity,
      additionalCalculatedPrices = [],
    } = product.node

    let {
      subtotal,
      grandTotal,
      tax,
    } = summary

    const {
      shipping,
    } = summary

    let additionalCalculatedPriceTax = 0

    let additionalCalculatedPrice = 0

    additionalCalculatedPrices.forEach((item: CustomFieldItems) => {
      additionalCalculatedPriceTax += item.additionalCalculatedPriceTax
      additionalCalculatedPrice += item.additionalCalculatedPrice
    })

    subtotal += priceCalc((+basePrice + additionalCalculatedPrice) * quantity)
    tax += priceCalc((+productTax + additionalCalculatedPriceTax) * quantity)

    grandTotal = subtotal + shipping

    return {
      grandTotal,
      shipping,
      tax,
      subtotal,
    }
  }, {
    ...defaultSummary,
  })

  return newQuoteSummary
}
