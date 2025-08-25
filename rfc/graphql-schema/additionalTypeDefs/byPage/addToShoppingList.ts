export default /* GraphQL */ `
  input ShoppingListLineItemCheckboxOptionInput {
    optionEntityId: ID!
    optionValueEntityId: ID!   
  }

  input ShoppingListLineItemDateFieldOptionInput {
    optionEntityId: ID!
    date: DateTime!
  }

  input ShoppingListLineItemMultiLineTextOptionInput {
    optionEntityId: ID!
    text: String!
  }

  input ShoppingListLineItemMultipleChoiceOptionInput {
    optionEntityId: ID!
    optionValueEntityId: ID!
  }

  input ShoppingListLineItemNumberFieldOptionInput {
    optionEntityId: ID!
    number: Float!
  }

  input ShoppingListLineItemTextOptionInput {
    optionEntityId: ID!
    text: String!
  }

  input ShoppingListLineItemOptions {
    checkbox: [ShoppingListLineItemCheckboxOptionInput!]
    dateFields: [ShoppingListLineItemDateFieldOptionInput!]
    multiLineTextFields: [ShoppingListLineItemMultiLineTextOptionInput!]
    multipleChoices: [ShoppingListLineItemMultipleChoiceOptionInput!]
    numberFields: [ShoppingListLineItemNumberFieldOptionInput!]
    textFields: [ShoppingListLineItemTextOptionInput!]
  }

  input ShoppingListLineItemInput {
    productEntityId: ID!
    variantEntityId: ID!
    quantity: Int!
    options: [ShoppingListLineItemOptions!]
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

  extend type CustomerMutations {
    addToShoppingList(input: AddToShoppingListInput!): AddToShoppingListResult!
  }

  extend type CompanyMutations {
    addToShoppingList(input: AddToShoppingListInput!): AddToShoppingListResult!
  }
`
