export default /* GraphQL */ `
  extend type Company {
    id: ID!
    name: String!
    # this is arguably the nicest ways for clients to get the tree
    # (rather than getting a flattened list and building it themselves)
    # however, it will require the BE to add recursion/max nodes protection
    subsidiaries: CompanyConnection!
    # what is "channelFlag" represent?
    channelFlag: Boolean!
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

  # taken from "dashboard" STARTS
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
  }

  extend type Mutation {
    activeCompany: ActiveCompanyMutations!
  }
  # taken from "dashboard" ENDS
`
