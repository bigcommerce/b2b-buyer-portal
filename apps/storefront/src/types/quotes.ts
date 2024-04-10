import { Product } from './products'

export interface AdditionalCalculatedPricesProps {
  additionalCalculatedPrice: number
  additionalCalculatedPriceTax: number
}

export type CalculatedValue = Record<
  string,
  string | number | Array<string | number> | Record<string, string | number>
>

export interface BcCalculatedPrice {
  as_entered: number
  entered_inclusive: boolean
  tax_exclusive: number
  tax_inclusive: number
}

export interface QuoteItem {
  node: {
    basePrice: number
    id: string
    optionList: string
    primaryImage?: string
    productId?: number
    productName?: string
    quantity: number
    taxPrice: number
    variantId?: number
    variantSku?: string
    calculatedValue: CalculatedValue
    productsSearch: Product
    additionalCalculatedPrices?: AdditionalCalculatedPricesProps
  }
}
