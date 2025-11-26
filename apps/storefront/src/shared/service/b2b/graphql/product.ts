import { channelId, storeHash } from '@/utils/basicConfig';
import { getActiveCurrencyInfo } from '@/utils/currencyUtils';
import { convertArrayToGraphql } from '@/utils/graphqlDataConvert';

import B3Request from '../../request/b3Fetch';

interface ProductPurchasable {
  productId: number;
  isProduct: boolean;
  sku: string;
}

const getVariantInfoBySkusQuery = (skuList: string[]) => `
query GetVariantInfoBySkus {
  variantSku (
    variantSkus: ${convertArrayToGraphql(skuList)},
    storeHash: "${storeHash}"
    channelId: ${channelId}
  ){
    isStock,
    stock,
    calculatedPrice,
    productId,
    variantId,
    baseSku,
    productName,
    categories,
    option,
    isVisible,
    minQuantity,
    maxQuantity,
    modifiers,
    purchasingDisabled,
    variantSku,
    imageUrl,
  }
}`;

const getProductPurchasable = ({
  sku = '',
  isProduct = true,
  productId,
}: ProductPurchasable) => `query GetProductPurchasable {
  productPurchasable(
    storeHash: "${storeHash}"
    productId: ${Number(productId)},
    sku: "${sku}",
    isProduct: ${isProduct}
    ){
    availability
    inventoryLevel
    inventoryTracking
    purchasingDisabled
    availableToSell
    unlimitedBackorder
  }
}`;

const getSearchProductsQuery = (data: CustomFieldItems) => `
  query SearchProducts {
    productsSearch (
      search: "${data.search || ''}"
      productIds: [${data.productIds || []}]
      currencyCode: "${data.currencyCode || ''}"
      companyId: "${data.companyId || ''}"
      storeHash: "${storeHash}"
      channelId: ${channelId}
      customerGroupId: ${data.customerGroupId || 0}
      ${data?.categoryFilter ? `categoryFilter: ${data?.categoryFilter}` : ''}
    ){
      id,
      name,
      sku,
      costPrice,
      inventoryLevel,
      inventoryTracking,
      availability,
      orderQuantityMinimum,
      orderQuantityMaximum,
      variants,
      currencyCode,
      imageUrl,
      modifiers,
      options,
      optionsV3,
      channelId,
      productUrl,
      taxClassId,
      isPriceHidden,
      availableToSell,
      unlimitedBackorder
    }
  }
`;

const validateProductQuery = `
  query ValidateProduct ($productId: Int!, $variantId: Int!, $quantity: Int!, $productOptions: [GenericScalar]) {
    validateProduct(
      productId: $productId
      variantId: $variantId
      quantity: $quantity
      productOptions: $productOptions
      storeHash: "${storeHash}"
      channelId: ${channelId}
    ) {
      responseType
      message
    }
  }
`;

const productsBulkUploadCSV = (data: CustomFieldItems) => `mutation ProductUpload {
  productUpload (
    productListData: {
      currencyCode: "${data.currencyCode || ''}"
      productList: ${convertArrayToGraphql(data.productList || [])}
      ${!data?.channelId ? '' : `channelId: ${data.channelId}`}
      isToCart: ${data.isToCart || false}
      withModifiers: ${data.withModifiers || false}
    }
  ) {
    result {
      errorFile,
      errorProduct,
      validProduct,
      stockErrorFile,
      stockErrorSkus,
    }
  }
}`;

const productAnonUploadBulkUploadCSV = (data: CustomFieldItems) => `mutation {
  productAnonUpload (
    productListData: {
      currencyCode: "${data.currencyCode || ''}"
      productList: ${convertArrayToGraphql(data.productList || [])}
      ${!data?.channelId ? '' : `channelId: ${data.channelId}`}
      isToCart: ${data.isToCart || false}
      withModifiers: ${data.withModifiers || false}
      storeHash: "${storeHash}"
    }
  ) {
    result {
      errorFile,
      errorProduct,
      validProduct,
      stockErrorFile,
      stockErrorSkus,
    }
  }
}`;

export const getVariantInfoBySkus = (skuList: string[] = []) =>
  B3Request.graphqlB2B({ query: getVariantInfoBySkusQuery(skuList) });

export interface B2BProductPurchasableResponse {
  data: {
    productPurchasable: {
      availability: 'available' | 'disabled';
      availableToSell?: number;
      inventoryLevel: number;
      inventoryTracking: 'none' | 'product' | 'variant';
      purchasingDisabled: boolean;
      unlimitedBackorder?: boolean;
    };
  };
}

export const getB2BProductPurchasable = (data: ProductPurchasable) =>
  B3Request.graphqlB2B<B2BProductPurchasableResponse>({
    query: getProductPurchasable(data),
  });

export interface ProductSearch {
  id: number;
  name: string;
  sku: string;
  costPrice: string;
  inventoryLevel: number;
  inventoryTracking: string;
  availability: string;
  orderQuantityMinimum: number;
  orderQuantityMaximum: number;
  variants: {
    variant_id: number;
    product_id: number;
    sku: string;
    option_values: {
      id: number;
      label: string;
      option_id: number;
      option_display_name: string;
    }[];
    calculated_price: number;
    image_url: string;
    has_price_list: boolean;
    bulk_prices: unknown[];
    purchasing_disabled: boolean;
    cost_price: number;
    inventory_level: number;
    bc_calculated_price: {
      as_entered: number;
      tax_inclusive: number;
      tax_exclusive: number;
      entered_inclusive: boolean;
    };
  }[];
  currencyCode: string;
  imageUrl: string;
  modifiers: unknown[];
  options: {
    option_id: number;
    display_name: string;
    sort_order: number;
    is_required: boolean;
  }[];
  optionsV3: {
    id: number;
    product_id: number;
    name: string;
    display_name: string;
    type: string;
    sort_order: number;
    option_values: {
      id: number;
      label: string;
      sort_order: number;
      value_data: unknown | null;
      is_default: boolean;
    }[];
    config: unknown[];
  }[];
  channelId: unknown[];
  productUrl: string;
  taxClassId: number;
  isPriceHidden: boolean;
}

export interface B2BProducts {
  data: {
    productsSearch: ProductSearch[];
  };
}

export interface SearchProductsResponse {
  data: {
    productsSearch: Array<{
      id: number;
      name: string;
      sku: string;
      costPrice: string;
      inventoryLevel: number;
      inventoryTracking: string;
      availability: string;
      orderQuantityMinimum: number;
      orderQuantityMaximum: number;
      variants: Array<{
        variant_id: number;
        product_id: number;
        sku: string;
        option_values: Array<{
          id: number;
          label: string;
          option_id: number;
          option_display_name: string;
        }>;
        calculated_price: number;
        image_url: string;
        has_price_list: boolean;
        bulk_prices: Array<unknown>;
        purchasing_disabled: boolean;
        cost_price: number;
        inventory_level: number;
        available_to_sell: number;
        unlimited_backorder: boolean;
        bc_calculated_price: {
          as_entered: number;
          tax_inclusive: number;
          tax_exclusive: number;
          entered_inclusive: boolean;
        };
      }>;
      currencyCode: string;
      imageUrl: string;
      modifiers: Array<unknown>;
      options: Array<{
        option_id: number;
        display_name: string;
        sort_order: number;
        is_required: boolean;
      }>;
      optionsV3: Array<{
        id: number;
        product_id: number;
        name: string;
        display_name: string;
        type: string;
        sort_order: number;
        option_values: Array<{
          id: number;
          label: string;
          sort_order: number;
          value_data: unknown;
          is_default: boolean;
        }>;
        config: Array<unknown>;
      }>;
      channelId: Array<unknown>;
      productUrl: string;
      taxClassId: number;
      isPriceHidden: boolean;
      availableToSell: number;
      unlimitedBackorder: boolean;
    }>;
  };
}

export interface ValidateProductResponse {
  data: {
    validateProduct: {
      responseType: 'ERROR' | 'WARNING' | 'SUCCESS';
      message: string;
      errorCode: string;
    };
  };
}

export const searchProducts = (data: CustomFieldItems = {}) => {
  const { currency_code: currencyCode } = getActiveCurrencyInfo();

  return B3Request.graphqlB2B({
    query: getSearchProductsQuery({
      ...data,
      currencyCode: data?.currencyCode || currencyCode,
    }),
  });
};

interface ValidateProductVariables {
  productId: number;
  variantId: number;
  quantity: number;
  productOptions?: {
    optionId: number;
    optionValue: string;
  }[];
}

export const validateProduct = (data: ValidateProductVariables) => {
  return B3Request.graphqlB2B<ValidateProductResponse>({
    query: validateProductQuery,
    variables: data,
  }).then((res) => res.validateProduct);
};

export const B2BProductsBulkUploadCSV = (data: CustomFieldItems = {}) =>
  B3Request.graphqlB2B({
    query: productsBulkUploadCSV(data),
  }).then((res) => res.productUpload);

export const BcProductsBulkUploadCSV = (data: CustomFieldItems = {}) =>
  B3Request.graphqlB2B({
    query: productsBulkUploadCSV(data),
  }).then((res) => res.productUpload);

export const guestProductsBulkUploadCSV = (data: CustomFieldItems = {}) =>
  B3Request.graphqlB2B({
    query: productAnonUploadBulkUploadCSV(data),
  }).then((res) => res.productAnonUpload);
