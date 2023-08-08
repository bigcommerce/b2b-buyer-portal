import { B3SStorage, convertArrayToGraphql, storeHash } from '@/utils'

import B3Request from '../../request/b3Fetch'

const getVariantInfoBySkus = ({ skus = [] }) => `{
  variantSku (
    variantSkus: ${convertArrayToGraphql(skus)},
    storeHash: "${storeHash}"
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
  }
}`

const getVariantSkuByProductId = (productId: string) => `{
  productVariantsInfo (
    productId: "${productId}"
  ){
    sku,
    variantId,
  }
}`

const searchProducts = (data: CustomFieldItems) => `{
  productsSearch (
    search: "${data.search || ''}"
    productIds: [${data.productIds || []}]
    currencyCode: "${data.currencyCode || ''}"
    companyId: "${data.companyId || ''}"
    storeHash: "${storeHash}"
    channelId: ${B3SStorage.get('B3channelId') || 1}
    customerGroupId: ${data.customerGroupId || 0}
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
  }
}`

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
}`

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
}`

export const getB2BVariantInfoBySkus = (
  data: CustomFieldItems = {},
  customMessage = false
): CustomFieldItems =>
  B3Request.graphqlB2B(
    {
      query: getVariantInfoBySkus(data),
    },
    customMessage
  )

export const getB2BVariantSkuByProductId = (
  productId: string
): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: getVariantSkuByProductId(productId),
  })

export const searchB2BProducts = (
  data: CustomFieldItems = {}
): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: searchProducts(data),
  })

export const searchBcProducts = (
  data: CustomFieldItems = {}
): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: searchProducts(data),
  })

export const getBcVariantInfoBySkus = (
  data: CustomFieldItems = {}
): CustomFieldItems =>
  B3Request.graphqlB2BWithBCCustomerToken({
    query: getVariantInfoBySkus(data),
  })

export const B2BProductsBulkUploadCSV = (
  data: CustomFieldItems = {}
): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: productsBulkUploadCSV(data),
  })

export const BcProductsBulkUploadCSV = (
  data: CustomFieldItems = {}
): CustomFieldItems =>
  B3Request.graphqlB2BWithBCCustomerToken({
    query: productsBulkUploadCSV(data),
  })

export const guestProductsBulkUploadCSV = (
  data: CustomFieldItems = {}
): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: productAnonUploadBulkUploadCSV(data),
  })
