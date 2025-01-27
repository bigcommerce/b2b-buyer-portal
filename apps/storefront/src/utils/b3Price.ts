import isEmpty from 'lodash-es/isEmpty';

import { store } from '@/store';
import { Variant } from '@/types/products';

const getProductPriceIncTaxOrExTaxBySetting = (
  variants: Variant[],
  variantId?: number,
  variantSku?: string,
) => {
  const {
    global: { showInclusiveTaxPrice },
  } = store.getState();
  const currentVariantInfo: Variant | undefined = variants.find(
    (item: Variant) => Number(item.variant_id) === variantId || variantSku === item.sku,
  );

  if (currentVariantInfo && !isEmpty(currentVariantInfo)) {
    const bcCalculatedPrice: {
      tax_inclusive: number | string;
      tax_exclusive: number | string;
    } = currentVariantInfo.bc_calculated_price;

    const priceIncTax = showInclusiveTaxPrice
      ? Number(bcCalculatedPrice.tax_inclusive)
      : Number(bcCalculatedPrice.tax_exclusive);

    return priceIncTax;
  }

  return false;
};

const getProductPriceIncTax = (
  variants: CustomFieldItems,
  variantId?: number,
  variantSku?: string,
) => {
  const currentVariantInfo =
    variants.find(
      (item: CustomFieldItems) => Number(item.variant_id) === variantId || variantSku === item.sku,
    ) || {};

  if (!isEmpty(currentVariantInfo)) {
    const bcCalculatedPrice: {
      tax_inclusive: number | string;
    } = currentVariantInfo.bc_calculated_price;

    const priceIncTax = Number(bcCalculatedPrice.tax_inclusive);

    return priceIncTax;
  }

  return false;
};

export { getProductPriceIncTax, getProductPriceIncTaxOrExTaxBySetting };
