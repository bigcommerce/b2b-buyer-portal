import { AllOptionProps, ProductItem, Variant } from './products'

export interface ShoppingListItem {
  customerInfo: {
    firstName: string
    lastName: string
    userId: string
    email: string
  }
  description: string
  grandTotal: string
  id: string
  isOwner: boolean
  isShowGrandTotal: boolean
  name: string
  status: number
  totalDiscount: string
  totalTax: string
}

export interface ShoppingListProductItemOption {
  display_name: string
  is_required: boolean
  option_id: number
  sort_order: number
}

export interface ShoppingListProductItemModifiersOption {
  id: number
  is_default: boolean
  label: string
  option_id: number
  value_data?: {
    colors?: string[]
    product_id?: number
  }
}

export interface ShoppingListProductItemModifiers {
  config?: {
    default_value?: string
    text_characters_limited?: boolean
    text_max_length?: number
    text_min_length?: number
    text_lines_limited?: boolean
    text_max_lines?: number
    date_earliest_value?: string
    date_latest_value?: string
    date_limit_mode?: string
    date_limited?: boolean
    number_highest_value?: number
    number_integers_only?: boolean
    number_limit_mode?: string
    number_limited?: boolean
    number_lowest_value?: number
    checkbox_label?: string
    checked_by_default?: boolean
    file_max_size?: number
    file_types_mode?: string
    file_types_other?: string[]
    file_types_supported?: string[]
  }
  display_name: string
  id?: number | string
  option_values: ShoppingListProductItemModifiersOption[]
  required: boolean
  type: string
  isVariantOption?: boolean
}

export interface ShoppingListProductItemVariantsOption {
  id?: number
  label: string
  option_display_name: string
  option_id: number
}

export interface ShoppingListProductItem extends ProductItem {
  options?: ShoppingListProductItemOption[]
  optionsV3?: ShoppingListProductItemModifiers[]
  modifiers?: ShoppingListProductItemModifiers[]
  costPrice?: string
  variants?: Variant[]
  allOptions?: Partial<AllOptionProps>[]
  selectOptions?: string
  orderQuantityMaximum?: number
  orderQuantityMinimum?: number
  variantId?: number | string
  type?: string
}

export interface ShoppingListAddProductOption {
  optionId: string
  optionValue: string
}

export interface ShoppingListSelectProductOption {
  option_id: string
  option_value: string
  optionId: string
  optionValue: string
}
export interface ShoppingListAddProductItem {
  optionList: ShoppingListAddProductOption[]
  productId: number
  quantity: number
  variantId: number
}
