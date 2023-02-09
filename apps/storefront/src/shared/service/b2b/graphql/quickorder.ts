import {
  B3Request,
} from '../../request/b3Fetch'

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
        companyId,
        ordersInfo,
        orderProductId,
        sku,
        lastOrdered,
        optionSelections,
        imageUrl,
        channelId,
        channelName,
      }
    }
  }
}`

export const getOrderedProducts = (data: CustomFieldItems): CustomFieldItems => B3Request.graphqlB2B({
  query: orderedProducts(data),
})
