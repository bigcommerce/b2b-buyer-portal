import {
  ShoppingListProductItemModifiers,
  ShoppingListProductItemOption,
} from '@/types/shoppingList'

export interface ProductOptionsItem {
  option_id: number
  display_name: string
  display_value: string
}

export interface BcCalculatedPrice {
  as_entered: number
  entered_inclusive: boolean
  tax_exclusive: number
  tax_inclusive: number
}

export interface VariantsProps {
  bc_calculated_price: BcCalculatedPrice
  sku: string
  product_id: number | string
  variant_id: number | string
}

export interface ProductItem {
  id: number
  sku: string
  quantity: number
  imageUrl: string
  name: string
  base_price: string
  product_options?: ProductOptionsItem[]
  helperText?: string
  productUrl?: string
  variants?: VariantsProps[]
  price_inc_tax?: string | number
  price_ex_tax?: string | number
}

export interface ProductVariantSkuInfo {
  baseSku: string
  calculatedPrice: string
  categories: string[]
  isStock: string
  isVisible: string
  maxQuantity: number
  minQuantity: number
  modifiers: string[]
  option: string[]
  productId: string
  productName: string
  purchasingDisabled: string
  stock: number
  variantId: string
  variantSku: string
}

export interface OptionValue {
  id: number
  label: string
  option_display_name: string
  option_id: number
}

export interface Variant {
  variant_id: number
  product_id: number
  sku: string
  price: number
  option_values: OptionValue[]
  calculated_price: number
  image_url: string
  has_price_list: boolean
  bulk_prices?: any[] // not sure about the type
  purchasing_disabled: boolean
  cost_price?: number
  inventory_level: number
  bc_calculated_price: BcCalculatedPrice
}

export interface AdjustersPrice {
  adjuster: string
  adjuster_value: number
}

export interface ALlOptionValue {
  id: number
  label: string
  sort_order: number
  value_data: {
    colors?: string[]
    product_id?: number
    checked_value?: boolean
  } | null
  is_default: boolean
  adjusters?: {
    price: {
      adjuster: string
      adjuster_value: number
    } | null
    weight: {
      adjuster: string
      adjuster_value: number
    } | null
    image_url: string
    purchasing_disabled: {
      status: boolean
      message: string
    }
  } | null
  product_id?: number
}

export interface AllOptionProps {
  id: number | string
  product_id?: number
  name: string
  display_name: string
  type: string
  sort_order: number
  option_values: Partial<ALlOptionValue>[]
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
  required: boolean
  isVariantOption?: boolean
}

export interface Product {
  id: number
  name: string
  sku: string
  base_price: string
  costPrice: string
  channelId: number[]
  selectOptions: string
  inventoryLevel: number
  inventoryTracking: string
  availability: string
  orderQuantityMinimum: number
  orderQuantityMaximum: number
  variants?: Partial<Variant>[]
  currencyCode: string
  imageUrl: string
  modifiers: ShoppingListProductItemModifiers[]
  options?: ShoppingListProductItemOption[]
  optionsV3?: ShoppingListProductItemModifiers[]
  allOptions?: Partial<AllOptionProps>[]
  productUrl: string
  quantity: number | string
  [key: string]: any
}

export interface OptionListProduct {
  optionId: string
  optionValue: string
  option_id: string
  option_value: string
}

export interface CalculatedOptions {
  option_id: number
  value_id: number
}

export interface Calculateditems {
  product_id: number
  variant_id: number
  options: Partial<CalculatedOptions>[]
}

export interface CalculatedProducts {
  channel_id: number
  customer_group_id: number
  items: Partial<Calculateditems>[]
  currency_code: string
}
