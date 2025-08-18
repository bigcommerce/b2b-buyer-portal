export default /* GraphQL */ `

type PurchasedProductType implements Node {
    id: ID! # Proposed value for a UUID that can help us search for the product in the backend without depending on productId, variantId and options to add this product to cart.
    configuredProductId: ID!
    name: String!
    sku: String!
    price: Money!
    imageUrl: String!
    lastOrderedAt: DateTime!
    productOptions: [OrderLineItemProductOption!]!
}

type PurchasedProductEdge {
    node: PurchasedProductType!
    cursor: String!
}

type PurchasedProductConnection {
    edges: [PurchasedProductEdge!]!
    pageInfo: PageInfo!
    collectionInfo: CollectionInfo
}

input PurchasedProductDateRangeFilterInput {
    from: DateTime
    to: DateTime
}

input PurchasedProductsSearchInput {
    orderId: ID
    search: String
    dateRange: PurchasedProductDateRangeFilterInput
    before: String
    after: String
    first: Int
    last: Int
}

input ConfiguredProductInput {
    configuredProductId: ID! # shoppingList/<shoppingListId>/lineItem/<lineItemId> 
    quantity: Int!
}

input ProductValidationInput {
    sku: String!
}

input BulkProductValidationInput {
    products: [ProductValidationInput!]! 
}

type ProductValidationErrorType {
    lineNumber: Int!
    sku: String!
    field: String!
    message: String! # Can we get a translated string from the backend? Or should we send an error type for the frontend
}

type BulkProductValidationResult {
    success: Boolean! # Do we need this ? or assume empty errors means success
    errors: [ProductValidationErrorType!]!
}

input AddConfiguredProductsDataInput {
    configuredProducts: [ConfiguredProductInput!]!
}

input AddConfiguredProductsToCartInput {
    cartId: ID! # should we make this optional if its for a new cart?
    data: AddConfiguredProductsDataInput!
}

type AddConfiguredProductsToCartError implements Error {
    message: String!
}

type AddConfiguredProductsToCartResult {
    cart: Cart # AddCartLineItemsResult also returns cart
    errors: [AddConfiguredProductsToCartError!]! # Error only contains message: string.
}

input AddQuoteLineItemsDataInput {
    lineItems: [CartLineItemInput!]!
}

input AddQuoteLineItemsInput {
    quoteId: ID!
    data: AddQuoteLineItemsDataInput!
}

type AddQuoteLineItemsError implements Error {
    message: String!
}

type AddQuoteLineItemsResult {
    quote: Quote # AddCartLineItemsResult returns cart, we should return Quote
    errors: [AddQuoteLineItemsError!]! # Error only contains message: string.
}

input AddConfiguredProductsToShoppingListInput {
    shoppingListId: ID!
    data: AddConfiguredProductsDataInput!
}

type AddConfiguredProductsToShoppingListError implements Error {
    message: String!
}

type AddConfiguredProductsToShoppingListResult {
    shoppingList: ShoppingList
    errors: [AddConfiguredProductsToShoppingListError!]!
}

input AddConfiguredProductsToQuoteInput {
    # ignoring quote id, since draft quotes are unique per user
    data: AddConfiguredProductsDataInput!
}

type AddConfiguredProductsToQuoteError implements Error {
    message: String!
}

type AddConfiguredProductsToQuoteResult {
    quote: Quote
    errors: [AddConfiguredProductsToQuoteError!]!
}

extend type CartMutations {
    bulkProductValidation(input: BulkProductValidationInput!): BulkProductValidationResult!
    addConfiguredProducts(input: AddConfiguredProductsToCartInput!): AddConfiguredProductsToCartResult!
}

input CreateQuoteInput {
    title: String
    lineItems: [CartLineItemInput!]
    currencyCode: String
}

type CreateQuoteError implements Error {
    message: String!
}

type CreateQuoteResult {
    quote: Quote
    errors: [CreateQuoteError!]!
}

type QuoteMutations {
    create: (input: CreateQuoteInput!): CreateQuoteResult!
    addLineItems(input: AddQuoteLineItemsInput!): AddQuoteLineItemsResult!
    addConfiguredProducts(input: AddConfiguredProductsToQuoteInput!): AddConfiguredProductsToQuoteResult!
}

type ShoppingListMutations {
    addConfiguredProducts(
        input: AddConfiguredProductsToShoppingListInput!
    ): AddConfiguredProductsToShoppingListResult!
}

extend type Query {
    purchasedProducts(input: PurchasedProductsSearchInput!): PurchasedProductConnection!
}

extend type Mutation {
    quote: QuoteMutations 
    cart: CartMutations
    shoppingList: ShoppingListMutations
}

`
