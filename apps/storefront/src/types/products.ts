export interface ProductOptionsItem {
  option_id: number,
  display_name: string,
  display_value: string,
}

export interface ProductItem {
  id: number,
  sku: string,
  quantity: number,
  imageUrl: string,
  name: string,
  base_price: string,
  product_options?: ProductOptionsItem[]
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
