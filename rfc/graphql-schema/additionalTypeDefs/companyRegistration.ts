export default /* GraphQL */ `
  enum CompanyStatus {
    PENDING
    APPROVED
    REJECTED
    INACTIVE
    DELETED
  }

  extend type Company {
    id: ID!
    status: CompanyStatus!
  }

  input AddCompanyUsersInput {
    extraFields: CompanyExtraFieldsInput
  }

  input AddCompanyFileInput {
    id: ID!
  }

  input CompanyExtraFieldsInput {
    multipleChoices: [MultipleChoiceFormFieldInput!]
    numbers: [NumberFormFieldInput!]
    texts: [TextFormFieldInput!]
    multilineTexts: [MultilineTextFormFieldInput!]
  }

  input AddCompanyAddressInput {
    firstName: String!
    lastName: String!
    address1: String!
    address2: String
    city: String!
    countryCode: String!
    stateOrProvince: String
    phone: String
    postalCode: String
    extraFields: CompanyExtraFieldsInput
  }

  input RegisterCompanyInput {
    name: String!
    email: String!
    phone: String!
    fileList: [AddCompanyFileInput!]
    companyUser: AddCompanyUsersInput
    extraFields: CompanyExtraFieldsInput
    address: AddCompanyAddressInput!
  }

  type RegisterCompanyError implements Error {
    message: String!
  }

  type RegisterCompanyResult {
    company: Company
    errors: [RegisterCompanyError!]!
  }

  extend type CompanyMutations {
    registerCompany(input: RegisterCompanyInput!): RegisterCompanyResult!
  }

  enum UserRegistrationModes {
    CUSTOMERS_ONLY
    COMPANIES_ONLY
    CUSTOMERS_AND_COMPANIES
  }

  extend type CustomersSettings {
    registrationMode: UserRegistrationModes
  }

  type ExtraFields {
    companyRegistration: [FormField!]!
  }

  extend type Settings {
    extraFields: ExtraFields!
  }

  extend type Mutation {
    company: CompanyMutations!
  }
`
