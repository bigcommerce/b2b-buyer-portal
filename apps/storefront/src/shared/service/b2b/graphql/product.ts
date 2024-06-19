import { channelId, convertArrayToGraphql, getActiveCurrencyInfo, storeHash } from '@/utils';

import B3Request from '../../request/b3Fetch';

interface ProductPurchasable {
  productId: number;
  isProduct: boolean;
  sku: string;
}

const getVariantInfoBySkus = ({ skus = [] }) => `{
  variantSku (
    variantSkus: ${convertArrayToGraphql(skus)},
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

const getSkusInfo = ({ skus = [] }) => `{
  variantSku (
    variantSkus: ${convertArrayToGraphql(skus)},
    storeHash: "${storeHash}"
    channelId: ${channelId}
  ){
    isStock,
    stock,
    purchasingDisabled,
  }
}`;

const getProductPurchasable = ({ sku = '', isProduct = true, productId }: ProductPurchasable) => `{
  productPurchasable(
    storeHash: "${storeHash}"
    productId: ${+productId},
    sku:"${sku}",
    isProduct: ${isProduct}
    ){
    availability
    inventoryLevel
    inventoryTracking
    purchasingDisabled
  }
}`;

const getVariantSkuByProductId = (productId: string) => `{
  productVariantsInfo (
    productId: "${productId}"
  ){
    sku,
    variantId,
  }
}`;

const searchProducts = (data: CustomFieldItems) => `{
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
  }
}`;

const productsBulkUploadCSV = (data: CustomFieldItems) => `mutation {
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

export const getB2BVariantInfoBySkus = (data: CustomFieldItems = {}, customMessage = false) =>
  B3Request.graphqlB2B(
    {
      query: getVariantInfoBySkus(data),
    },
    customMessage,
  );

export const getB2BSkusInfo = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: getSkusInfo(data),
  });

export const getB2BProductPurchasable = (data: ProductPurchasable) =>
  B3Request.graphqlB2B({
    query: getProductPurchasable(data),
  });

export const getB2BVariantSkuByProductId = (productId: string) =>
  B3Request.graphqlB2B({
    query: getVariantSkuByProductId(productId),
  });

export const searchB2BProducts = (data: CustomFieldItems = {}) => {
  const { currency_code: currencyCode } = getActiveCurrencyInfo();

  return B3Request.graphqlB2B({
    query: searchProducts({
      ...data,
      currencyCode: data?.currencyCode || currencyCode,
    }),
  });
};

export const searchBcProducts = (data: CustomFieldItems = {}) => {
  const { currency_code: currencyCode } = getActiveCurrencyInfo();

  return B3Request.graphqlB2B({
    query: searchProducts({
      ...data,
      currencyCode: data?.currencyCode || currencyCode,
    }),
  });
};

export const getBcVariantInfoBySkus = (data: CustomFieldItems = {}) =>
  B3Request.graphqlB2B({
    query: getVariantInfoBySkus(data),
  });

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
