import { Product } from './products'

export interface ContactInfo {
  name: string
  email: string
  companyName: string
  phoneNumber: string
  quoteTitle?: string
}

export interface BillingAddress {
  address: string
  addressId: number
  apartment: string
  city: string
  companyName: string
  country: string
  firstName: string
  label: string
  lastName: string
  phoneNumber: string
  state: string
  zipCode: string
}

export interface ShippingAddress {
  address: string
  addressId: number
  apartment: string
  city: string
  companyName: string
  country: string
  firstName: string
  label: string
  lastName: string
  phoneNumber: string
  state: string
  zipCode: string
}

export interface FileInfo {
  id?: string
  fileName: string
  fileType: string
  fileUrl: string
  fileSize?: number
  title?: string
  hasDelete?: boolean
  isCustomer?: boolean
}

export interface AdditionalCalculatedPricesProps {
  additionalCalculatedPrice: number
  additionalCalculatedPriceTax: number
}

export type CalculatedValue = Record<
  string,
  string | number | Array<string | number> | Record<string, string | number>
>

export type ContactInfoKeys = keyof ContactInfo

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

export interface QuoteInfo {
  userId?: number
  contactInfo: ContactInfo
  shippingAddress: ShippingAddress
  billingAddress: BillingAddress
  fileInfo?: FileInfo[]
  note?: string
}
