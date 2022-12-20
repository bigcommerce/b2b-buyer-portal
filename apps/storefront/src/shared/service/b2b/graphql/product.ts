import {
  B3Request,
} from '../../request/b3Fetch'

import {
  convertArrayToGraphql,
} from '../../../../utils'

const getVariantInfoBySkus = ({
  skus = [],
}) => `{
  variantSku (
    variantSkus: ${convertArrayToGraphql(skus)}
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
  }
}`

export const getB2BVariantInfoBySkus = (data: CustomFieldItems = {}): CustomFieldItems => B3Request.graphqlB2B({
  query: getVariantInfoBySkus(data),
})

export const getB2BVariantSkuByProductId = (productId: string): CustomFieldItems => B3Request.graphqlB2B({
  query: getVariantSkuByProductId(productId),
})

export const searchB2BProducts = (data: CustomFieldItems = {}): CustomFieldItems => B3Request.graphqlB2B({
  query: searchProducts(data),
})
