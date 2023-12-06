import { OptionValueProps } from '@/utils/b3Product/shared/config'

export interface LineItems {
  quantity: number
  productId: number
  variantId: number
  optionSelections: OptionValueProps[]
}

export interface CreateCartInput {
  createCartInput: {
    lineItems: [
      {
        quatinty: number
        productEntityId: number
      }
    ]
  }
}

export interface DeleteCartInput {
  deleteCartInput: {
    cartEntityId: string
  }
}
