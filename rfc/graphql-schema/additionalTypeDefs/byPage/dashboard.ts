export default /* GraphQL */ `
  type Company implements Node {
    id: ID!
    name: String!
    email: String!
  }

  type CompanyEdge {
    node: Company!
    cursor: String!
  }

  type CompanyConnection {
    edges: [CompanyEdge!]!
    pageInfo: PageInfo!
    collectionInfo: CollectionInfo!
  }

  input CompanyFiltersInput {
    search: String
  }

  enum CompanySortInput {
    A_Z
    Z_A
    EMAIL_A_Z
    EMAIL_Z_A
  }

  extend type Query {
    activeCompany: Company
    companies(
      filters: CompanyFiltersInput
      sortBy: CompanySortInput
      before: String
      after: String
      first: Int
      last: Int
    ): CompanyConnection!
  }

  type SetActiveCompanyError implements Error {
    message: String!
  }

  type ClearActiveCompanyError implements Error {
    message: String!
  }

  type SetActiveCompanyResult {
    activeCompany: Company
    errors: [SetActiveCompanyError!]!
  }

  type ClearActiveCompanyResult {
    errors: [ClearActiveCompanyError!]!
  }

  type ActiveCompanyMutations {
    set(companyId: ID!): SetActiveCompanyResult
    # is this really a feature? what can they do when they are not masquerading that they can't while they are?
    # for a b2b user, only "super-admins" can be on a "non-company" state. Can we default them to the last company they were on and remove the clear mutation?
    clear: ClearActiveCompanyResult
  }

  extend type Mutation {
    activeCompany: ActiveCompanyMutations!
  }
`
