import type { CatalogQuickVariantSku } from '@/shared/service/b2b/graphql/product';
import { OrderProductItem } from '@/types';
import {
  getProductDetailsForPicklistSelections,
  type PicklistSelection,
} from '@/utils/catalogBackorderDisplay';

// Orders store picklist selections as product_options, not the {option_id, value_id} shape
// getProductDetailsForPicklistSelections expects — product_option_id is the canonical optionId
// here (matches optionList elsewhere in this file), value is the value_id as a string.
export function getOrderPicklistSelections(
  product: OrderProductItem,
  catalogInventoryBySku: Record<string, CatalogQuickVariantSku>,
): PicklistSelection[] {
  const optionSelections = (product.product_options || []).map((option) => ({
    option_id: option.product_option_id,
    value_id: Number(option.value),
  }));

  if (optionSelections.length === 0) {
    return [];
  }

  const modifiers = catalogInventoryBySku[product.sku.toUpperCase()]?.modifiers;

  return getProductDetailsForPicklistSelections({
    optionSelections,
    productsSearch: { modifiers },
  });
}
