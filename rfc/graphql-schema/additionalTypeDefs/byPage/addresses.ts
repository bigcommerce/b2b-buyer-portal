export default /* GraphQL */ `
  type AddressType {
    isShipping: Boolean!
    isBilling: Boolean!
    isDefaultShipping: Boolean!
    isDefaultBilling: Boolean!
  }

  interface CompanyAddress implements CustomerAddress {
    entityId: Int!
    firstName: String!
    lastName: String!
    address1: String!
    address2: String
    addressType: DestinationAddressType
    city: String!
    country: String
    countryId: Int
    countryCode: String!
    stateOrProvince: String
    stateId: Int
    phone: String
    postalCode: String
    formFields: [CustomerFormFieldValue!]!

    company: Company!

    label: String!

    addressType: AddressType!
  }

  type CompanyAddressEdge {
    node: CompanyAddress!
    cursor: String!
  }

  type CompanyAddressConnection {
    edges: [CompanyAddressEdge!]!
    pageInfo: PageInfo!
    collectionInfo: CollectionInfo
  }

  input CompanyAddressFiltersInput {
    search: String
    city: String
    state: String
    country: String
  }

  extend type Company {
    addresses(
      filters: CompanyAddressFiltersInput
      before: String
      after: String
      first: Int
      last: Int
    ): CompanyAddressConnection!
  }

  input CompanyAddressCreateInput {
    firstName: String!
    lastName: String!
    address1: String!
    address2: String
    city: String!
    countryCode: String!
    stateOrProvince: String
    phone: String
    postalCode: String
    extraFields: CustomerFormFieldsInput

    label: String!
    isShipping: Boolean!
    isBilling: Boolean!
    isDefaultShipping: Boolean!
    isDefaultBilling: Boolean!
  }

  input AddressTypeInput {
    isShipping: Boolean!
    isBilling: Boolean!
    isDefaultShipping: Boolean!
    isDefaultBilling: Boolean!
  }

  input CompanyAddressUpdateInput {
    firstName: String
    lastName: String
    address1: String
    address2: String
    city: String
    countryCode: String
    stateOrProvince: String
    phone: String
    postalCode: String
    extraFields: CustomerFormFieldsInput

    label: String!

    addressType: AddressTypeInput!
  }

  type CompanyAddressResult {
    address: CompanyAddress
    errors: [CompanyAddressError!]!
  }

  type CompanyAddressError implements Error {
    message: String!
  }

  type CompanyAddressDeleteError implements Error {
    message: String!
  }

  type CompanyAddressDeleteResult {
    errors: [CompanyAddressDeleteError!]!
  }

  input SetAsDefaultInput {
    isDefaultShipping: Boolean
    isDefaultBilling: Boolean
  }

  type CompanyFormFields {
    address: [FormField!]!
  }

  extend type FormFields {
    company: CompanyFormFields!
  }

  extend type CompanyMutations {
    addAddress(
      companyId: ID!
      input: CompanyAddressCreateInput
    ): CompanyAddressResult!
    updateAddress(
      addressId: ID!
      input: CompanyAddressUpdateInput!
    ): CompanyAddressResult!
    setAddressAsDefault(
      addressId: ID!
      input: SetAsDefaultInput!
    ): CompanyAddressResult!
    deleteAddress(addressId: ID!): CompanyAddressDeleteResult!
  }
`
