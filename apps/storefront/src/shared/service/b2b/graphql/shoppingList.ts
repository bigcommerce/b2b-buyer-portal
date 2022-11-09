import {
  B3Request,
} from '../../request/b3Fetch'

interface CustomFieldItems {
  [key: string]: any
}

const getShoppingList = ({
  offset = 0,
  first = 50,
}: CustomFieldItems) => `{
  shoppingLists (
    offset: ${offset}
    first: ${first}
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
      }
    }
  }
}`

const createShoppingList = (data: CustomFieldItems) => `mutation{
  shoppingListsCreate(shoppingListsData: {
    name: "${data.name}",
    description: "${data.description}",
    status: ${data.status},
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

export const getB2BShoppingList = (data: CustomFieldItems = {}) => B3Request.graphqlB2B({
  query: getShoppingList(data),
})

export const createB2BShoppingList = (data: CustomFieldItems = {}) => B3Request.graphqlB2B({
  query: createShoppingList(data),
})
