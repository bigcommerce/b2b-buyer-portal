import { LangFormatFunction } from '@/lib/lang';
import { getCart } from '@/shared/service/bc/graphql/cart';
import { store } from '@/store';
import { OrderedProductType, ProductInfoType } from '@/types/gql/graphql';
import { LineItem } from '@/utils/b3Product/b3Product';
import { snackbar } from '@/utils/b3Tip';

interface ProductInfo extends OrderedProductType {
  productsSearch: ProductInfoType;
  quantity: number;
}

interface CommonProducts extends ProductInfoType {
  quantity: number;
  variantId?: string;
}

export interface CheckedProduct {
  node: ProductInfo;
}

/**
 * Checks whether a single product can be purchased at the given quantity.
 * Validates stock availability, purchasing-disabled status, and min/max order
 * quantity limits. Returns `{ isVerify: true }` on success, or shows a
 * snackbar error and returns `{ isVerify: false }` on failure.
 */
const handleVerifyProduct = (products: CustomFieldItems, b3Lang: LangFormatFunction) => {
  const {
    variantId,
    variants = [],
    inventoryLevel,
    inventoryTracking,
    orderQuantityMaximum,
    orderQuantityMinimum,
    quantity,
    sku,
  } = products;

  const isEnableProduct =
    store.getState().global?.blockPendingQuoteNonPurchasableOOS?.isEnableProduct || false;

  const isStock = inventoryTracking !== 'none';
  let purchasingDisabled = false;
  let stock = inventoryLevel;
  let productSku = sku;

  const currentVariant = variants.find(
    (variant: CustomFieldItems) => Number(variant.variant_id) === Number(variantId),
  );
  if (currentVariant) {
    purchasingDisabled = currentVariant.purchasing_disabled;
    stock = inventoryTracking === 'variant' ? currentVariant.inventory_level : stock;
    productSku = currentVariant.sku || sku;
  }
  let isVerify = true;

  if (purchasingDisabled && !isEnableProduct) {
    snackbar.error(
      b3Lang('purchasedProducts.quickOrderPad.notPurchaseableSku', {
        notPurchaseSku: productSku,
      }),
    );
    isVerify = false;
  }

  if (isStock && Number(quantity) > Number(stock)) {
    snackbar.error(
      b3Lang('purchasedProducts.quickOrderPad.insufficientStockSku', {
        sku: productSku,
      }),
    );
    isVerify = false;
  }

  if (Number(orderQuantityMinimum) > 0 && Number(quantity) < orderQuantityMinimum) {
    snackbar.error(
      b3Lang('purchasedProducts.quickOrderPad.minQuantityMessage', {
        minQuantity: orderQuantityMinimum,
        sku: productSku,
      }),
    );
    isVerify = false;
  }

  if (Number(orderQuantityMaximum) > 0 && Number(quantity) > Number(orderQuantityMaximum)) {
    snackbar.error(
      b3Lang('purchasedProducts.quickOrderPad.maxQuantityMessage', {
        maxQuantity: orderQuantityMaximum,
        sku: productSku,
      }),
    );
    isVerify = false;
  }

  return { isVerify };
};

/** Fetches the current cart and flattens all line items into a single array. */
export const getCartProductInfo = async () => {
  const {
    data: {
      site: { cart },
    },
  } = await getCart();

  if (cart) {
    const { lineItems } = cart;
    return Object.values(lineItems).reduce((pre, lineItems) => {
      lineItems.forEach((item: LineItem) => {
        pre.push(item);
      });

      return pre;
    }, [] as LineItem[]);
  }

  return [];
};

/**
 * Validates that every checked product can be purchased given current cart state.
 * Sums each product's requested quantity with its existing cart quantity, then
 * checks stock levels, min/max order limits, and purchasing-disabled status.
 * Returns only the checked products that pass validation (and shows snackbar errors for failures).
 */
export const addCartProductToVerify = async <T extends Partial<CheckedProduct>>(
  checkedArr: T[],
  b3lang: LangFormatFunction,
): Promise<T[]> => {
  const cartProducts: LineItem[] = await getCartProductInfo();

  return checkedArr.filter((checkItem) => {
    const { node } = checkItem;

    const existingCartQuantity =
      cartProducts.find(
        (item: LineItem) =>
          item.sku === node?.sku &&
          Number(item?.variantEntityId || 0) === Number(node?.variantId || 0),
      )?.quantity || 0;

    const productToVerify: CommonProducts = {
      ...node?.productsSearch,
      variantId: node?.variantId,
      quantity: (node?.quantity || 0) + existingCartQuantity,
    };

    return handleVerifyProduct(productToVerify, b3lang).isVerify;
  });
};
