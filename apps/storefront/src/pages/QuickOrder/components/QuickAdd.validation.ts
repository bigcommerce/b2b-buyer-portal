import { AddToCartItem } from '@/utils/cartUtils';

import { ShoppingListAddProductOption } from '../../../types';

export interface CatalogProduct {
  variantSku: string;
  productId: string;
  variantId: string;
  productName: string;
  option?: string[];
  purchasingDisabled?: string;
  stock?: string;
  isStock?: string;
  maxQuantity?: number;
  minQuantity?: number;
}

export function parseOptionList(options: string[] | undefined): ShoppingListAddProductOption[] {
  return (options || []).reduce((arr: ShoppingListAddProductOption[], optionStr: string) => {
    try {
      const option = typeof optionStr === 'string' ? JSON.parse(optionStr) : optionStr;
      arr.push({
        optionId: `attribute[${option.option_id}]`,
        optionValue: `${option.id}`,
      });
      return arr;
    } catch (error) {
      return arr;
    }
  }, []);
}

/**
 * Finds SKUs that were requested but not found in the catalog response.
 * Case-insensitive comparison.
 */
export function filterInputSkusForNotFoundProducts(
  inputSkus: string[],
  catalogProducts: CatalogProduct[],
): string[] {
  const foundSkus = catalogProducts.map((product) => product.variantSku.toUpperCase());
  return inputSkus.filter((sku) => !foundSkus.includes(sku.toUpperCase()));
}

/**
 * Maps catalog products to the format expected by add to cart.
 * Matches each catalog product with its requested quantity from input.
 */
export function mapCatalogToAddToCartPayload(
  catalogProducts: CatalogProduct[],
  skuQuantities: Record<string, number | string | null | undefined>,
): AddToCartItem[] {
  return catalogProducts.map((catalogProduct) => {
    const matchingSkuFromInput = Object.keys(skuQuantities).find(
      (inputSku) => inputSku.toUpperCase() === catalogProduct.variantSku.toUpperCase(),
    );
    const requestedQuantity = matchingSkuFromInput
      ? Number(skuQuantities[matchingSkuFromInput]) || 0
      : 0;

    return {
      ...catalogProduct,
      productId: parseInt(catalogProduct.productId, 10) || 0,
      variantId: parseInt(catalogProduct.variantId, 10) || 0,
      quantity: requestedQuantity,
      optionSelections: parseOptionList(catalogProduct.option),
    };
  });
}
