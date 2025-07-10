export default /* GraphQL */ `
  type ShoppingListItemConnection {
    collectionInfo: CollectionInfo
  }

  enum ShoppingListStatus {
    DRAFT
    ARCHIVED
    AWAITING_APPROVAL
    APPROVED
    REJECTED
  }

  # Assuming ShoppingList is not absorbed into an upgraded "Wishlist"
  type ShoppingList implements Node {
    id: ID!
    name: String!
    description: String
    createdBy: Customer!
    items: ShoppingListItemConnection!
    updatedAt: DateTimeExtended!
    # B2C shopping lists do not need a status
    # we could split this into two entities OR
    # think of B2C shopping lists as created in a (not shown) "approved" status
    status: ShoppingListStatus!
  }

  type ShoppingListEdge {
    node: ShoppingList!
    cursor: String!
  }

  type ShoppingListConnection {
    pageInfo: PageInfo!
    collectionInfo: CollectionInfo
    edges: [ShoppingListEdge!]!
  }

  extend type Customer {
    shoppingLists(
      before: String
      after: String
      first: Int
      last: Int
    ): ShoppingListConnection!
  }

  input CompanyShoppingListsFiltersInput {
    createdBy: ID
    status: [ShoppingListStatus]
  }

  extend type Company {
    shoppingLists(
      filters: CompanyShoppingListsFiltersInput
      before: String
      after: String
      first: Int
      last: Int
    ): ShoppingListConnection!
  }

  type SomeCreateShoppingListError implements Error {
    message: String!
  }

  type AnotherCreateShoppingListError implements Error {
    message: String!
  }

  union CreateShoppingListError =
      SomeCreateShoppingListError
    | AnotherCreateShoppingListError

  type CreateShoppingListResult {
    shoppingList: ShoppingList
    errors: [CreateShoppingListError!]!
  }

  input CreateShoppingListInput {
    name: String!
    description: String
  }

  extend type CustomerMutations {
    # If a B2B customer makes a shopping list do they choose this,
    # or the one under Customer?
    # Could we drop the company one?
    createShoppingList(input: CreateShoppingListInput): CreateShoppingListResult
  }

  extend type CompanyMutation {
    createShoppingList(input: CreateShoppingListInput): CreateShoppingListResult
  }

  type SomeArchiveShoppingListError implements Error {
    message: String!
  }

  type AnotherArchiveShoppingListError implements Error {
    message: String!
  }

  union ArchiveShoppingListError =
      SomeArchiveShoppingListError
    | AnotherArchiveShoppingListError

  type ArchiveShoppingListResult {
    errors: [ArchiveShoppingListError!]!
  }

  extend type CustomerMutations {
    # potential behaviour change, archive vs delete
    archiveShoppingList(id: ID!): ArchiveShoppingListResult
  }

  extend type CompanyMutations {
    # potential behaviour change, archive vs delete
    archiveShoppingList(id: ID!): ArchiveShoppingListResult
  }

  type SomeCopyShoppingListError implements Error {
    message: String!
  }

  type AnotherCopyShoppingListError implements Error {
    message: String!
  }

  union CopyShoppingListError =
      SomeCopyShoppingListError
    | AnotherCopyShoppingListError

  type CopyShoppingListResult {
    shoppingList: ShoppingList
    errors: [CopyShoppingListError!]!
  }

  input CopyShoppingListInput {
    name: String
    description: String
  }

  extend type CustomerMutations {
    # "copy" sounds more natural than "duplicate"
    copyShoppingList(
      id: ID!
      input: CopyShoppingListInput
    ): CopyShoppingListResult
  }

  extend type CompanyMutations {
    # "copy" sounds more natural than "duplicate"
    copyShoppingList(
      id: ID!
      input: CopyShoppingListInput
    ): CopyShoppingListResult
  }

  type SomeUpdateShoppingListDetailsError implements Error {
    message: String!
  }

  type AnotherUpdateShoppingListDetailsError implements Error {
    message: String!
  }

  union UpdateShoppingListDetailsError =
      SomeUpdateShoppingListDetailsError
    | AnotherUpdateShoppingListDetailsError

  type UpdateShoppingListDetailsResult {
    shoppingList: ShoppingList
    errors: [UpdateShoppingListDetailsError!]!
  }

  input UpdateShoppingListDetailsInput {
    name: String
    description: String
  }

  extend type CustomerMutations {
    updateShoppingListDetails(
      id: ID!
      input: UpdateShoppingListDetailsInput
    ): UpdateShoppingListDetailsResult
  }

  extend type CompanyMutations {
    updateShoppingListDetails(
      id: ID!
      input: UpdateShoppingListDetailsInput
    ): UpdateShoppingListDetailsResult
  }
`
