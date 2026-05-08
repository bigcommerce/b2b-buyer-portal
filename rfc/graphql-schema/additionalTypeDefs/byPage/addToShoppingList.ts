export default /* GraphQL */ `
  input ShoppingListLineItemInput {
    productEntityId: ID!
    variantEntityId: ID!
    quantity: Int!
    options: [CartSelectedOptionsInput!]
  }

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
    errors: [AddToShoppingListError!]!
  }

  extend type ShoppingListMutations {
    addLineItem(input: AddToShoppingListInput!): AddToShoppingListResult!
  }
`
