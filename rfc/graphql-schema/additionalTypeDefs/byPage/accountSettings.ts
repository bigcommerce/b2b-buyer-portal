export default /* GraphQL */ `
  type CompanyRelationship {
    company: Company!
    role: Role!
  }

  extend type Customer {
    companyRelationship: CompanyRelationship
  }

  type CompanyFormFields {
    user: [FormField!]! # This includes b2c customer fields + b2b extra fields
  }

  extend type FormFields {
    company: CompanyFormFields!
  }

  input UpdateCustomerInput {
    firstName: String!
    lastName: String!
    email: String!
    phone: String
    company: String
    formFields: CustomerFormFieldsInput
  }

  type CustomerMutations {
    updateCustomer(input: UpdateCustomerInput!): UpdateCustomerResult
  }

  extend type Mutation {
    customer: CustomerMutations
  }
`
