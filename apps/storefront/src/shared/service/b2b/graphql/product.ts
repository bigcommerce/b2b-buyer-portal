import {
  B3Request,
} from '../../request/b3Fetch'

const getVariantInfoBySkus = ({
  skus = [],
}) => `{
  variantSku (
    variantSkus: "${skus}"
  ){
    isStock,
    stock,
    calculatedPrice,
    imageUrl,
    inventoryLevel,
    productId,
    variantId,
    baseSku,
    productName,
    categories,
    price,
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

export const getB2BVariantInfoBySkus = (data: CustomFieldItems = {}): CustomFieldItems => B3Request.graphqlB2B({
  query: getVariantInfoBySkus(data),
})

export const getB2BVariantSkuByProductId = (productId: string): CustomFieldItems => B3Request.graphqlB2B({
  query: getVariantSkuByProductId(productId),
})
