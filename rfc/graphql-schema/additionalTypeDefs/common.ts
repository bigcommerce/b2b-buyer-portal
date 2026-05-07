export default /* GraphQL */ `
  type Customer implements Node {
    id: ID!
  }

  type Order implements Node {
    id: ID!
  }

  type Site {
    _placeholder: Boolean
  }

  type CustomerMutations {
    _placeholder: Boolean
  }

  type CartMutations {
    _placeholder: Boolean
  }

  type CatalogMutations {
    _placeholder: Boolean
  }

  type Settings {
    customers: CustomersSettings
  }

  type CustomersSettings {
    _placeholder: Boolean
  }

  type OrderLineItemProductOption {
    name: String!
    value: String!
  }

  input OrdersFiltersInput {
    _placeholder: String
  }

  input UpdateCustomerInput {
    _placeholder: String
  }

  interface Error {
    message: String!
  }

  scalar DateTime

  type DateTimeExtended {
    utc: DateTime!
  }

  type Cart {
    entityId: ID!
  }

  type Money {
    currencyCode: String!
    value: Decimal!
  }

  type Image {
    url: String!
    altText: String
  }

  type CustomerFormFieldValue {
    name: String!
    value: String!
  }

  type QuoteExtraFieldsConfigType implements Node {
    id: ID!
    fieldName: String
    fieldType: String
    isRequired: Boolean
    isUnique: Boolean
    valueConfigs: GenericScalar
  }

  type CustomerAddress {
    firstName: String
    lastName: String
    address1: String
    address2: String
    city: String
    stateOrProvince: String
    postalCode: String
    country: String
    countryCode: String
    phone: String
  }

  type CollectionInfo {
    totalItems: Int!
  }

  type FormField {
    name: String!
    label: String
    value: String
    required: Boolean
  }

  input CustomerFormFieldsInput {
    texts: [CustomerFormFieldTextInput!]
    multilineTexts: [CustomerFormFieldMultilineTextInput!]
    multipleChoices: [CustomerFormFieldMultipleChoiceInput!]
    numbers: [CustomerFormFieldNumberInput!]
  }

  input CustomerFormFieldTextInput {
    name: String!
    text: String!
  }

  input CustomerFormFieldMultilineTextInput {
    name: String!
    multilineText: String!
  }

  input CustomerFormFieldMultipleChoiceInput {
    name: String!
    fieldValue: String!
  }

  input CustomerFormFieldNumberInput {
    name: String!
    number: String!
  }

  input TextFormFieldInput {
    name: String!
    text: String!
  }

  input MultilineTextFormFieldInput {
    name: String!
    multilineText: String!
  }

  input MultipleChoiceFormFieldInput {
    name: String!
    fieldValue: String!
  }

  input NumberFormFieldInput {
    name: String!
    number: String!
  }

  input CartSelectedOptionsInput {
    entityId: ID!
    valueEntityId: ID
    value: String
  }

  type CartSelectedOption {
    entityId: ID!
    valueEntityId: ID
    value: String
  }

  input CartLineItemInput {
    productEntityId: ID!
    variantEntityId: ID
    quantity: Int!
    selectedOptions: CartSelectedOptionsInput
  }

  input ShoppingListLineItemInput {
    productEntityId: ID!
    variantEntityId: ID!
    quantity: Int!
    options: [CartSelectedOptionsInput!]
  }
`
