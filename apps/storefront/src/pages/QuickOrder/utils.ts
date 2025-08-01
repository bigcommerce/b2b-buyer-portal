import { LangFormatFunction } from '@b3/lang';

import { getCart } from '@/shared/service/bc/graphql/cart';
import { store } from '@/store';
import { OrderedProductType, ProductInfoType } from '@/types/gql/graphql';
import { snackbar } from '@/utils';
import { LineItem } from '@/utils/b3Product/b3Product';

export interface ProductInfo extends OrderedProductType {
  productsSearch: ProductInfoType;
  quantity: number;
}

export interface CommonProducts extends ProductInfoType {
  quantity: number;
  variantId?: string;
}

export interface CheckedProduct {
  node: ProductInfo;
}

export const handleVerifyProduct = (products: CustomFieldItems, b3Lang: LangFormatFunction) => {
  const {
    variantId,
    variants,
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

  if (purchasingDisabled && !isEnableProduct) {
    snackbar.error(
      b3Lang('purchasedProducts.quickOrderPad.notPurchaseableSku', {
        notPurchaseSku: productSku,
      }),
    );

    return {
      isVerify: false,
      type: 'notPurchaseableSku',
    };
  }

  if (isStock && Number(quantity) > Number(stock)) {
    snackbar.error(
      b3Lang('purchasedProducts.quickOrderPad.insufficientStockSku', {
        sku: productSku,
      }),
    );

    return {
      isVerify: false,
      type: 'insufficientStockSku',
    };
  }

  if (Number(orderQuantityMinimum) > 0 && Number(quantity) < orderQuantityMinimum) {
    snackbar.error(
      b3Lang('purchasedProducts.quickOrderPad.minQuantityMessage', {
        minQuantity: orderQuantityMinimum,
        sku: productSku,
      }),
    );

    return {
      isVerify: false,
      type: 'minQuantity',
    };
  }

  if (Number(orderQuantityMaximum) > 0 && Number(quantity) > Number(orderQuantityMaximum)) {
    snackbar.error(
      b3Lang('purchasedProducts.quickOrderPad.maxQuantityMessage', {
        maxQuantity: orderQuantityMaximum,
        sku: productSku,
      }),
    );

    return {
      isVerify: false,
      type: 'maxQuantity',
    };
  }

  return {
    isVerify: true,
  };
};

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

export const addCartProductToVerify = async (
  checkedArr: Partial<CheckedProduct>[],
  b3lang: LangFormatFunction,
) => {
  const cartProducts: LineItem[] = await getCartProductInfo();

  const addCommonProducts = checkedArr.reduce((pre, checkItem) => {
    const { node } = checkItem;

    const num =
      cartProducts.find(
        (item: LineItem) =>
          item.sku === node?.sku &&
          Number(item?.variantEntityId || 0) === Number(node?.variantId || 0),
      )?.quantity || 0;

    pre.push({
      ...node?.productsSearch,
      variantId: node?.variantId,
      quantity: (node?.quantity || 0) + num,
    });

    return pre;
  }, [] as CommonProducts[]);

  return addCommonProducts.every((product) => {
    return handleVerifyProduct(product, b3lang).isVerify;
  });
};
