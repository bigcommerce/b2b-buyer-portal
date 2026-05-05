import { faker } from '@faker-js/faker';
import { addMocksToSchema } from '@graphql-tools/mock';
import { makeExecutableSchema } from '@graphql-tools/schema';
import additionalTypeDefs from '@rfc/graphql-schema/additionalTypeDefs';
import canonicalSchema from '@rfc/graphql-schema/b2b-full-schema.graphql?raw';

const scalarMocks = {
  String: () => 'Mock string',
  Int: () => faker.number.int({ min: 1, max: 100 }),
  Boolean: () => true,
  ID: () => faker.string.uuid(),
  Date: () => '2026-05-04',
  DateTime: () => '2026-05-04T00:00:00.000Z',
  Decimal: () => '12.34',
  CurrencyDecimalPlaces: () => 2,
  JSONString: () => JSON.stringify({ mock: true }),
  GenericScalar: () => ({ mock: true }),
  ProductQuantity: () => 2,
};

const executableSchema = makeExecutableSchema({
  typeDefs: [canonicalSchema, ...additionalTypeDefs],
});

export const mockSchema = addMocksToSchema({
  schema: executableSchema,
  mocks: scalarMocks,
  preserveResolvers: true,
});
