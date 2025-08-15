export default /* GraphQL */ `
  type SalesRep implements Node {
    id: ID!
    email: String!
  }

  enum QuoteStatus {
    DRAFT
    OPEN
    ORDERED
    EXPIRED
  }

  # at this point the differences between draft/normal are:
  # - no expiration for draft
  # - salesRep MIGHT be N/A for draft
  # which seem small enough to go for optional
  # over separate types and a union
  type Quote implements Node {
    id: ID!
    status: QuoteStatus!
    createdBy: Customer!
    title: String
    subtotal: Money!
    createdAt: DateTime!
    updatedAt: DateTime!
    expirationDate: DateTime
    salesRep: SalesRep
  }

  input QuotesDateRangeFilterInput {
    from: DateTime
    to: DateTime
  }

  input QuotesFiltersInput {
    searchTerm: String
    createdBy: ID
    salesRep: ID
    status: [QuoteStatus]
    dateRange: QuotesDateRangeFilterInput
  }

  type QuotesEdge {
    node: Quote!
    cursor: String!
  }

  type QuotesConnection {
    edges: [QuotesEdge!]!
    pageInfo: PageInfo!
    collectionInfo: CollectionInfo!
  }

  enum QuotesSortInput {
    TITLE_A_TO_Z
    TITLE_Z_TO_A
    CREATED_BY_A_TO_Z
    CREATED_BY_Z_TO_A
    SALES_REP_A_TO_Z
    SALES_REP_Z_TO_A
    CREATED_AT_NEWEST
    CREATED_AT_OLDEST
    LAST_UPDATE_NEWEST
    LAST_UPDATE_OLDEST
    EXPIRATION_DATE_NEWEST
    EXPIRATION_DATE_OLDEST
    STATUS_A_TO_Z
    STATUS_Z_TO_A
  }

  type SalesRepsConnection {
    edges: [SalesRep!]!
    pageInfo: PageInfo!
    collectionInfo: CollectionInfo!
  }

  extend type Query {
    quotes(
      filters: QuotesFiltersInput
      sortBy: QuotesSortInput
      before: String
      after: String
      first: Int
      last: Int
    ): QuotesConnection!
    # Used to populate the "sales rep" quote filter options
    # this would list all reps, not just ones attached to quotes
    salesReps(
      before: String
      after: String
      first: Int
      last: Int
    ): SalesRepsConnection!
    # the "created by" filter option would be populated by
    # activeCompany.customers (?)
    # this would list all customers, not just ones with quotes
  }
`
