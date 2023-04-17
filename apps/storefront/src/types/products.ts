export interface ProductOptionsItem {
  option_id: number,
  display_name: string,
  display_value: string,
}

export interface BcCalculatedPrice {
  as_entered: number,
  entered_inclusive: boolean,
  tax_exclusive: number,
  tax_inclusive: number,
}

export interface VariantsProps {
  bc_calculated_price: BcCalculatedPrice,
  sku: string,
  product_id: number | string,
  variant_id: number | string,
}

export interface ProductItem {
  id: number,
  sku: string,
  quantity: number,
  imageUrl: string,
  name: string,
  base_price: string,
  product_options?: ProductOptionsItem[],
  helperText?: string,
  productUrl?: string,
  variants?: VariantsProps[],
  price_inc_tax?: string | number,
  price_ex_tax?: string | number,
}

export interface ProductVariantSkuInfo{
  baseSku: string,
  calculatedPrice: string,
  categories: string[],
  isStock: string,
  isVisible: string,
  maxQuantity: number,
  minQuantity: number,
  modifiers: string[],
  option: string[],
  productId: string,
  productName: string,
  purchasingDisabled: string,
  stock: number,
  variantId: string,
  variantSku: string,
}
