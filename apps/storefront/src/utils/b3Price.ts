import { isEmpty } from 'lodash'

const getProductPriceIncTax = (
  variants: CustomFieldItems,
  variantId?: number,
  variantSku?: string
) => {
  const currentVariantInfo =
    variants.find(
      (item: CustomFieldItems) =>
        +item.variant_id === variantId || variantSku === item.sku
    ) || {}

  if (!isEmpty(currentVariantInfo)) {
    const bcCalculatedPrice: {
      tax_inclusive: number | string
    } = currentVariantInfo.bc_calculated_price

    const priceIncTax = +bcCalculatedPrice.tax_inclusive

    return priceIncTax
  }

  return false
}

export default getProductPriceIncTax
