import B3Request from '../../request/b3Fetch'

// import {
//   convertArrayToGraphql,
//   storeHash,
// } from '../../../../utils'

const orderedProducts = (data: CustomFieldItems) => `{
  orderedProducts (
    q: "${data.q || ''}"
    first: ${data.first}
    offset: ${data.offset}
    beginDateAt: "${data.beginDateAt}"
    endDateAt: "${data.endDateAt}"
  ){
    totalCount,
    pageInfo{
      hasNextPage,
      hasPreviousPage,
    },
    edges{
      node {
        id,
        createdAt,
        updatedAt,
        productName,
        productBrandName,
        variantSku,
        productId,
        variantId,
        optionList,
        orderedTimes,
        firstOrderedAt,
        lastOrderedAt,
        lastOrderedItems,
        sku,
        lastOrdered,
        imageUrl,
        baseSku,
        basePrice,
        discount,
        tax,
        enteredInclusive,
        productUrl,
        optionSelections,
      }
    }
  }
}`

export const getOrderedProducts = (data: CustomFieldItems): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: orderedProducts(data),
  })

export const getBcOrderedProducts = (
  data: CustomFieldItems
): CustomFieldItems =>
  B3Request.graphqlB2BWithBCCustomerToken({
    query: orderedProducts(data),
  })
