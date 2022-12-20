import {
  B3Request,
} from '../../request/b3Fetch'

import {
  convertObjectToGraphql,
  convertArrayToGraphql,
} from '../../../../utils'

const getStatus = (status: any): string => {
  if (typeof status === 'number') {
    return `status: ${status}`
  }
  if (typeof status === 'object') {
    return `status: [${status}]`
  }
  return ''
}

const getShoppingList = ({
  offset = 0,
  first = 50,
  status = '',
  createdBy = '',
  search = '',
}) => `{
  shoppingLists (
    offset: ${offset}
    first: ${first}
    search: "${search}"
    createdBy: "${createdBy}"
    ${getStatus(status)}
  ){
    totalCount,
    pageInfo{
      hasNextPage,
      hasPreviousPage,
    },
    edges{
      node{
        id,
        name,
        description,
        status,
        customerInfo{
          firstName,
          lastName,
          userId,
          email,
        },
        isOwner,
        grandTotal,
        totalDiscount,
        totalTax,
        isShowGrandTotal,
        products {
          totalCount,
        }
      }
    }
  }
}`

const createOrUpdateShoppingList = (fn: string, data: CustomFieldItems) => `mutation{
  ${fn}(
    ${!data?.id ? '' : `id: ${data.id}`}
    ${!data?.sampleShoppingListId ? '' : `sampleShoppingListId: ${data.sampleShoppingListId}`}
    shoppingListData: {
      name: "${data.name}",
      description: "${data.description}",
      ${typeof data?.status === 'number' ? `status: ${data.status}` : ''}
  }) {
    shoppingList {
      id,
      name,
      description,
      status,
      customerInfo{
        firstName,
        lastName,
        userId,
        email,
      },
      isOwner,
      grandTotal,
      totalDiscount,
      totalTax,
      isShowGrandTotal,
    }
  }
}`

const deleteShoppingList = (id: number) => `mutation{
  shoppingListsDelete(id: ${id}) {
    message
  }
}`

const updateShoppingListsItem = (data: CustomFieldItems) => `mutation {
  shoppingListsItemsUpdate(
    itemId: ${data.itemId}
    shoppingListId: ${data.shoppingListId}
    itemData: ${convertObjectToGraphql(data.itemData || [])}
  ) {
    shoppingListsItem {
      id,
      createdAt,
      updatedAt,
      productId,
      variantId,
      quantity,
      productName,
      optionList,
      itemId,
      baseSku,
      variantSku,
      basePrice,
      discount,
      tax,
      enteredInclusive,
      productUrl,
      primaryImage,
    }
  }
}`

const getShoppingListDetails = (data: CustomFieldItems) => `{
  shoppingList (
    id: ${data.id}
  ) {
    id,
    createdAt,
    updatedAt,
    name,
    description,
    status,
    reason,
    customerInfo {
      firstName,
      lastName,
      userId,
      email,
    },
    isOwner,
    grandTotal,
    totalDiscount,
    totalTax,
    isShowGrandTotal,
    channelId,
    channelName,
    products (
      offset: ${data.offset || 0}
      first: ${data.first || 100},
      search: "${data.search || ''}",
    ) {
      totalCount,
      edges {
        node {
          id,
          createdAt,
          updatedAt,
          productId,
          variantId,
          quantity,
          productName,
          optionList,
          itemId,
          baseSku,
          variantSku,
          basePrice,
          discount,
          tax,
          enteredInclusive,
          productUrl,
          primaryImage,
        }
      }
    }
  }
}`

const addItemsToShoppingList = (data: CustomFieldItems) => `mutation {
  shoppingListsItemsCreate(
    shoppingListId: ${data.shoppingListId},
    items: ${convertArrayToGraphql(data.items || [])}
  ) {
    shoppingListsItems {
      id,
      createdAt,
      updatedAt,
      productId,
      variantId,
      quantity,
      productName,
      optionList,
      itemId,
      baseSku,
      variantSku,
      basePrice,
      discount,
      tax,
      enteredInclusive,
      productUrl,
      primaryImage,
    }
  }
}`

const deleteShoppingListItem = (data: CustomFieldItems) => `mutation {
  shoppingListsItemsDelete(
    itemId: ${data.itemId},
    shoppingListId: ${data.shoppingListId},
  ) {
    message,
  }
}`

export const getB2BShoppingList = (data: CustomFieldItems = {}): CustomFieldItems => B3Request.graphqlB2B({
  query: getShoppingList(data),
})

export const createB2BShoppingList = (data: CustomFieldItems = {}): CustomFieldItems => B3Request.graphqlB2B({
  query: createOrUpdateShoppingList('shoppingListsCreate', data),
})

export const updateB2BShoppingList = (data: CustomFieldItems = {}): CustomFieldItems => B3Request.graphqlB2B({
  query: createOrUpdateShoppingList('shoppingListsUpdate', data),
})

export const duplicateB2BShoppingList = (data: CustomFieldItems = {}): CustomFieldItems => B3Request.graphqlB2B({
  query: createOrUpdateShoppingList('shoppingListsDuplicate', data),
})

export const deleteB2BShoppingList = (id: number): CustomFieldItems => B3Request.graphqlB2B({
  query: deleteShoppingList(id),
})

export const getB2BShoppingListDetails = (data: CustomFieldItems = {}): CustomFieldItems => B3Request.graphqlB2B({
  query: getShoppingListDetails(data),
})

export const addProductToShoppingList = (data: CustomFieldItems = {}): CustomFieldItems => B3Request.graphqlB2B({
  query: addItemsToShoppingList(data),
})

export const updateB2BShoppingListsItem = (data: CustomFieldItems = {}): CustomFieldItems => B3Request.graphqlB2B({
  query: updateShoppingListsItem(data),
})

export const deleteB2BShoppingListItem = (data: CustomFieldItems = {}): CustomFieldItems => B3Request.graphqlB2B({
  query: deleteShoppingListItem(data),
})
