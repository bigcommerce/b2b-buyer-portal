export default /* GraphQL */ `

type PurchasedProductOptionType {
    label: String!
    value: String!
}

type PurchasedProductType implements Node {
    id: ID! # Proposed value for a UUID that can help us search for the product in the backend without depending on productId, variantId and options to add this product to cart.
    name: String!
    sku: String!
    money: Money!
    imageUrl: String!
    lastOrderedAt: DateTime!
    options: [PurchasedProductOptionType!]!
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
    from: DateTime!
    to: DateTime
}

input PurchasedProductsSearchInput {
    search: String
    dateRange: PurchasedProductDateRangeFilterInput
    before: String
    after: String
    first: Int
    last: Int
}

input PurchasedProductInput {
    purchasedProductId: ID!
    quantity: Int!
}

input ProductValidationInput {
    sku: String!
    quantity: Int!
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

input AddPurchasedProductsDataInput {
    purchasedProducts: [PurchasedProductInput!]!
}

input AddPurchasedProductsToCartInput {
    cartId: ID! # should we make this optional if its for a new cart?
    data: AddPurchasedProductsDataInput!
}

type AddPurchasedProductsToCartError implements Error {
    message: String!
}

type AddPurchasedProductsToCartResult {
    cart: Cart # AddCartLineItemsResult also returns cart
    errors: [AddPurchasedProductsToCartError!]! # Error only contains message: string.
}

input AddQuoteLineItemsDataInput {
    lineItems: [CartLineItemInput!]!
}

input AddQuoteLineItemsInput {
    quoteId: String!
    data: AddQuoteLineItemsDataInput!
}

type AddQuoteLineItemsError implements Error {
    message: String!
}

type AddQuoteLineItemsResult {
    quote: Quote # AddCartLineItemsResult returns cart, we should return Quote
    errors: [AddQuoteLineItemsError!]! # Error only contains message: string.
}

input AddPurchasedProductsToShoppingListInput {
    shoppingListId: ID!
    data: AddPurchasedProductsDataInput!
}

type AddPurchasedProductsToShoppingListError implements Error {
    message: String!
}

type AddPurchasedProductsToShoppingListResult {
    shoppingList: ShoppingList
    errors: [AddPurchasedProductsToShoppingListError!]!
}

input AddPurchasedProductsToQuoteInput {
    quoteId: ID!
    data: AddPurchasedProductsDataInput!
}

type AddPurchasedProductsToQuoteError implements Error {
    message: String!
}

type AddPurchasedProductsToQuoteResult {
    quote: Quote
    errors: [AddPurchasedProductsToQuoteError!]!
}

extend type CartMutations {
    bulkProductValidation(input: BulkProductValidationInput!): BulkProductValidationResult!
    addPurchasedProducts(input: AddPurchasedProductsToCartInput!): AddPurchasedProductsToCartResult!
}

type QuoteMutations {
    addQuoteLineItems(input: AddQuoteLineItemsInput!): AddQuoteLineItemsResult!
    addPurchasedProductsToQuote(input: AddPurchasedProductsToQuoteInput!): AddPurchasedProductsToQuoteResult!
}

type ShoppingListMutations {
    addPurchasedProductsToShoppingList(
        input: AddPurchasedProductsToShoppingListInput!
    ): AddPurchasedProductsToShoppingListResult!
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
