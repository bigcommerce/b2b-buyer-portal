export default /* GraphQL */ `
  type CompanyRelationship {
    company: Company!
    role: Role!
  }

  extend type Customer {
    companyRelationship: CompanyRelationship
  }

  type ExtraFields {
    companyUser: [FormField!]!
  }

  extend type Settings {
    extraFields: ExtraFields!
  }

  extend input UpdateCustomerInput {
    extraFields: CustomerFormFieldsInput # This is only used for companyUser extra fields
  }

  # This is already defined in storefront schema, added here for clarity
  # type CustomerMutations {
  #   updateCustomer(input: UpdateCustomerInput!): UpdateCustomerResult
  # }

  extend type Mutation {
    customer: CustomerMutations
  }
`
