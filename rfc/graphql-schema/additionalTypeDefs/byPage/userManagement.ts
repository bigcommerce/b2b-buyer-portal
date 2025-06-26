export default /* GraphQL */ `
  input CustomerFiltersInput {
    search: String
    companyRoleId: ID
  }

  type Role {
    id: ID!
    name: String!
  }

  extend type Customer {
    role: Role
  }

  type CustomerEdge {
    node: Customer!
    cursor: String!
  }

  type CustomerConnection {
    edges: [CustomerEdge!]
    pageInfo: PageInfo!
  }

  type Company implements Node {
    id: ID!
    Customers(
      filters: CustomerFiltersInput
      before: String
      after: String
      first: Int
      last: Int
    ): CustomerConnection!
  }

  # Placeholder for real domain errors
  type SomeChangeCustomerRoleError implements Error {
    message: String!
  }

  # Placeholder for real domain errors
  type AnotherChangeCustomerRoleError implements Error {
    message: String!
  }

  union ChangeCustomerRoleError =
      SomeChangeCustomerRoleError
    | AnotherChangeCustomerRoleError

  type ChangeCustomerRoleResult {
    errors: [ChangeCustomerRoleError!]!
    customer: Customer
  }

  # Placeholder for real domain errors
  type SomeDeregistrationError implements Error {
    message: String!
  }

  # Placeholder for real domain errors
  type AnotherDeregistrationError implements Error {
    message: String!
  }

  union DeregisterCustomerError =
      SomeDeregistrationError
    | AnotherDeregistrationError

  type DeregistrationResult {
    errors: [DeregisterCustomerError!]!
  }

  # Placeholder for real domain errors
  type SomeDeregistrationError implements Error {
    message: String!
  }

  # Placeholder for real domain errors
  type AnotherDeregistrationError implements Error {
    message: String!
  }

  input RegisterCompanyCustomerInput {
    firstName: String!
    lastName: String!
    email: String!
    roleId: ID!
    phone: String
    formFields: CustomerFormFieldsInput
  }

  type CompanyMutations {
    changeCustomerRole(customerId: Int!, roleId: ID!): ChangeCustomerRoleResult!
    deregisterCustomer(customerId: Int!): DeregistrationResult!
    registerCustomer(
      input: RegisterCompanyCustomerInput!
    ): RegisterCustomerResult!
  }

  extend type Mutation {
    company(id: ID!): CompanyMutations!
  }

  extend type Query {
    company(id: ID!): Company!
  }
`
