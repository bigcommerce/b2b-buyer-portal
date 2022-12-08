import {
  B3Request,
} from '../../request/b3Fetch'

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
    ${typeof status !== 'number' ? '' : `status: ${status}`}
    search: "${search}"
    createdBy: "${createdBy}"
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
