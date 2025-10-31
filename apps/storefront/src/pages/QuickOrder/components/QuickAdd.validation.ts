import { ShoppingListAddProductOption } from '../../../types';

export interface CatalogProduct {
  variantSku: string;
  productId: string;
  variantId: string;
  option?: string[];
  purchasingDisabled?: string;
  stock?: string;
  isStock?: string;
  maxQuantity?: number;
  minQuantity?: number;
}

interface ValidationPayloadItem {
  node: {
    productId: number;
    quantity: number;
    productsSearch: {
      variantId: number;
      newSelectOptionList: ShoppingListAddProductOption[];
    };
  };
}

interface CartItem {
  productId: number;
  quantity: number;
  variantId: number;
  newSelectOptionList: ShoppingListAddProductOption[];
  variantSku: string;
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
 * Maps catalog products to the format expected by backend validation.
 * Matches each catalog product with its requested quantity from input.
 */
export function mapCatalogToValidationPayload(
  catalogProducts: CatalogProduct[],
  skuQuantities: Record<string, number | string | null | undefined>,
): ValidationPayloadItem[] {
  return catalogProducts.map((catalogProduct) => {
    const matchingSkuFromInput = Object.keys(skuQuantities).find(
      (inputSku) => inputSku.toUpperCase() === catalogProduct.variantSku.toUpperCase(),
    );
    const requestedQuantity = matchingSkuFromInput
      ? Number(skuQuantities[matchingSkuFromInput]) || 0
      : 0;

    return {
      node: {
        productId: parseInt(catalogProduct.productId, 10) || 0,
        quantity: requestedQuantity,
        productsSearch: {
          variantId: parseInt(catalogProduct.variantId, 10) || 0,
          newSelectOptionList: parseOptionList(catalogProduct.option),
        },
      },
    };
  });
}

/**
 * Merges backend validation results with original catalog data.
 * Returns only the fields needed for cart operations.
 */
export function mergeValidatedWithCatalog(
  validatedProducts: CustomFieldItems[],
  catalogProducts: CatalogProduct[],
): CartItem[] {
  return validatedProducts.map(({ node: validatedProduct }: CustomFieldItems) => {
    const originalProductInfo = catalogProducts.find(
      (catalogProduct) => parseInt(catalogProduct.productId, 10) === validatedProduct.productId,
    );

    return {
      productId: validatedProduct.productId,
      quantity: validatedProduct.quantity,
      variantId: validatedProduct.productsSearch.variantId,
      newSelectOptionList: validatedProduct.productsSearch.newSelectOptionList,
      variantSku: originalProductInfo?.variantSku || '',
    };
  });
}
