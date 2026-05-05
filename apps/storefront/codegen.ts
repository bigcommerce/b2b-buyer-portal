import type { CodegenConfig } from '@graphql-codegen/cli';

const { CODEGEN_ENV = 'production' } = process.env;

const canonicalMockSchema = [
  '../../rfc/graphql-schema/b2b-full-schema.graphql',
  '../../rfc/graphql-schema/additionalTypeDefs/**/*.ts',
];

const mockCodegenCompatibilityTypeDefs = /* GraphQL */ `
  scalar DateTime
  scalar DateTimeExtended

  interface Error {
    message: String!
  }

  type Cart implements Node {
    id: ID!
  }

  type CartSelectedOption {
    name: String!
    value: String!
  }

  type CartMutations {
    placeholder: Boolean
  }

  type CatalogMutations {
    placeholder: Boolean
  }

  type CollectionInfo {
    totalItems: Int!
  }

  type Company implements Node {
    id: ID!
  }

  type Customer implements Node {
    id: ID!
  }

  type CustomerAddress implements Node {
    id: ID!
  }

  type CustomerFormFieldValue {
    name: String!
    value: String!
  }

  type CustomerMutations {
    updateCustomer(input: UpdateCustomerInput!): UpdateCustomerResult
  }

  type FormField {
    name: String!
    value: String
  }

  type Image {
    url: String!
    altText: String
  }

  type Money {
    value: Float!
    currencyCode: String!
  }

  type Order implements Node {
    id: ID!
  }

  type OrderEdge {
    node: Order!
    cursor: String!
  }

  type OrderLineItemProductOption {
    name: String!
    value: String!
  }

  type OrdersConnection {
    edges: [OrderEdge!]!
    pageInfo: PageInfo!
    collectionInfo: CollectionInfo
  }

  type RegisterCustomerResult {
    customer: Customer
    errors: [Error!]!
  }

  type Settings {
    id: ID
  }

  type ShoppingListItemConnection {
    edges: [ShoppingListItemEdge!]!
    pageInfo: PageInfo!
    collectionInfo: CollectionInfo
  }

  type Site {
    id: ID
  }

  type CreateCartResult {
    cart: Cart
    errors: [Error!]!
  }

  type UpdateCustomerResult {
    customer: Customer
    errors: [Error!]!
  }

  enum OrderStatus {
    PENDING
    COMPLETED
    CANCELLED
  }

  enum OrderStatusValue {
    PENDING
    COMPLETED
    CANCELLED
  }

  input CartLineItemInput {
    productEntityId: ID!
    variantEntityId: ID
    quantity: Int!
    selectedOptions: CartSelectedOptionsInput
  }

  input CartSelectedOptionsInput {
    multipleChoices: [ID!]
    text: String
  }

  input CustomerFormFieldsInput {
    text: [TextFormFieldInput!]
    multilineText: [MultilineTextFormFieldInput!]
    numbers: [NumberFormFieldInput!]
    multipleChoices: [MultipleChoiceFormFieldInput!]
  }

  input MultilineTextFormFieldInput {
    name: String!
    value: String!
  }

  input MultipleChoiceFormFieldInput {
    name: String!
    value: String!
  }

  input NumberFormFieldInput {
    name: String!
    value: Float!
  }

  input OrderDateRangeFilterInput {
    startAt: DateTime
    endAt: DateTime
  }

  input OrdersFiltersInput {
    status: OrderStatusValue
  }

  input TextFormFieldInput {
    name: String!
    value: String!
  }

  input UpdateCustomerInput {
    id: ID
  }
`;

const mockSchemaExclusions = [
  '!../../rfc/graphql-schema/additionalTypeDefs/index.ts',
  '!../../rfc/graphql-schema/additionalTypeDefs/byPage/quickOrder.ts',
];

const envs: Record<string, { schema: string | string[] }> = {
  local: {
    schema: 'http://localhost:9000/graphql',
  },
  mock: {
    schema: [...canonicalMockSchema, ...mockSchemaExclusions, mockCodegenCompatibilityTypeDefs],
  },
  production: {
    schema: 'https://api-b2b.bigcommerce.com/graphql',
  },
};

const selectedEnv = envs[CODEGEN_ENV];

if (!selectedEnv) {
  throw new Error(`Unknown CODEGEN_ENV: ${CODEGEN_ENV}`);
}

const config: CodegenConfig = {
  schema: selectedEnv.schema,
  config: {
    ignoreFieldConflicts: true,
    noRequire: true,
    includeSources: false,
    schemaExtensions: {
      schemaExtensions: {},
      types: {},
    },
  },
  documents: ['src/shared/service/**/*.ts'],
  generates: {
    './src/types/gql/': {
      preset: 'client',
      presetConfig: {
        gqlTagName: 'gql',
      },
    },
  },
  ignoreNoDocuments: true,
  allowPartialOutputs: true,
};

export default config;
