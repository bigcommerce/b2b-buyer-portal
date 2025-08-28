export default /* GraphQL */ `
  type ShoppingListItem implements Node {
    id: ID!
    configuredProductId: ID!
    name: String!
    sku: String!
    price: Money!
    imageUrl: String!
    quantity: Int!
    note: String!
    selectedOptions: [CartSelectedOption!]!
  }

  type ShoppingListItemEdge {
    node: ShoppingListItem!
    cursor: String!
  }

  extend type ShoppingListItemConnection {
    edges: [ShoppingListItemEdge!]!
    pageInfo: PageInfo!
    collectionInfo: CollectionInfo
  }

  type ShoppingListResult implements Node {
    id: ID!
    name: String!
    description: String
    createdBy: Customer!
    items: ShoppingListItemConnection!
    updatedAt: DateTimeExtended!
    status: ShoppingListStatus!
  }

  extend type Query {
    shoppingList(id: ID!): ShoppingListResult!
  }

  input ConfiguredProduct {
    id: ID!
    quantity: Int!
  }

  input AddConfiguredProductToShoppingListDataInput {
    configuredProducts: [ConfiguredProduct!]!
  }

  input AddConfiguredProductToShoppingListInput {
    shoppingListId: ID!
    data: AddConfiguredProductToShoppingListDataInput!
  }

  input AddLineItemToShoppingListData {
    lineItems: [CartLineItemInput!]!
  }

  input AddLineItemToShoppingListInput {
    shoppingListId: ID!
    data: AddLineItemToShoppingListData!
  }

  type AddToShoppingListResult {
    shoppingList: ShoppingListResult
    errors: [Error!]!
  }

  input DeleteShoppingListItemInput {
    shoppingListId: ID!
    itemId: ID!
  }

  input UpdateShoppingListItemNoteInput {
    shoppingListId: ID!
    itemId: ID!
    note: String!
  }

  input UpdateShoppingListItemQuantityInput {
    shoppingListId: ID!
    itemId: ID!
    quantity: Int!
  }

  input UpdateShoppingListItemDataInput {
    lineItem: CartLineItemInput!
    quantity: Int!
  }

  input UpdateShoppingListItemInput {
    shoppingListId: ID!
    itemId: ID!
    data: UpdateShoppingListItemDataInput!
  }

  input ShoppingListSubmitForApprovalInput {
    id: ID!
  }

  input ShoppingListApproveInput {
    id: ID!
  }

  input ShoppingListRejectInput {
    id: ID!
    # reason: String! # Do we want to add a reason?
  }

  type ShoppingListMutations {
    addConfiguredProduct(
      input: AddConfiguredProductToShoppingListInput!
    ): AddToShoppingListResult!
    addLineItem(
      input: AddLineItemToShoppingListInput!
    ): AddToShoppingListResult!
    deleteItem(input: DeleteShoppingListItemInput!): ShoppingListResult!
    updateItemNote(input: UpdateShoppingListItemNoteInput!): ShoppingListResult!
    updateItemQuantity(
      input: UpdateShoppingListItemQuantityInput
    ): ShoppingListResult!
    updateLineItem(input: UpdateShoppingListItemInput!): ShoppingListResult!

    # Approval process
    submitForApproval(
      id: ShoppingListSubmitForApprovalInput!
    ): ShoppingListResult!
    approveShoppingList(id: ShoppingListApproveInput!): ShoppingListResult!
    rejectShoppingList(id: ShoppingListRejectInput!): ShoppingListResult!
  }

  # This UI uses a priceProduct query to figure out the price of a modified item before adding it to the shopping list.
  # At the moment, this query fetches all the pricing data and figures out what to show, in an ideal world we'd get a "computedPrice"
  # directly from the API. Check if there is one already in catalyst.
  # Alternatively, we could show base price in the UI and only show total after adding to the shopping list.

  # The queries for the QuickPad are shared with the one in the 'Quick Order' page. (Search/Search by SKU, Bulk Upload)
  # The QuickPad in the ShoppingListDetails page allows adding items to an existing shopping list using a LineItem.

  # CSV upload is handled with the 'bulkProductValidation' also part of the QuickOrder page.

  extend type Mutation {
    shoppingList: ShoppingListMutations
  }
`
