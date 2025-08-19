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
    customers(
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

  input ChangeCustomerRoleDataInput{
    roleId: ID!
  }

  input ChangeCustomerRoleInput {
    customerId: ID!
    data: ChangeCustomerRoleDataInput!
  }

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

  input DeregisterCustomerInput {
    companyId: ID!
    customerId: Int!
  }

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

  input RegisterCompanyCustomerDataInput {
    firstName: String!
    lastName: String!
    email: String!
    roleId: ID!
    phone: String
    formFields: CustomerFormFieldsInput
  }

  input RegisterCompanyCustomerInput {
    data: RegisterCompanyCustomerDataInput!
  }

  type CompanyMutations {
    changeCustomerRole(input: ChangeCustomerRoleInput!): ChangeCustomerRoleResult!
    deregisterCustomer(input: DeregisterCustomerInput!): DeregistrationResult!
    registerCustomer(
      input: RegisterCompanyCustomerInput!
    ): RegisterCustomerResult!
  }

  extend type Mutation {
    company: CompanyMutations!
  }

  extend type Query {
    company(id: ID!): Company!
  }
`
