export default /* GraphQL */ `
  input AddToShoppingListDataInput {
    lineItems: [ShoppingListLineItemInput!]!
  }

  input AddToShoppingListInput {
    shoppingListId: ID!
    data: AddToShoppingListDataInput!
  }

  type AddToShoppingListError implements Error {
    message: String!
  }

  type AddToShoppingListResult {
    success: Boolean!
    errors: [Error!]!
  }

  extend type ShoppingListMutations {
    addLineItem(input: AddToShoppingListInput!): AddToShoppingListResult!
  }
`
