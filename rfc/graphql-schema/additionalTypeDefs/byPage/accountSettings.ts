export default /* GraphQL */ `
  type CompanyRelationship {
    company: Company!
    role: Role!
  }

  extend type Customer {
    companyRelationship: CompanyRelationship
  }

  input UpdateCustomerInput {
    firstName: String!
    lastName: String!
    email: String!
    phone: String
    formFields: CustomerFormFieldsInput
  }

  type CustomerMutations {
    updateCustomer(input: UpdateCustomerInput!): UpdateCustomerResult
  }

  extend type Mutation {
    customer: CustomerMutations
  }
`
