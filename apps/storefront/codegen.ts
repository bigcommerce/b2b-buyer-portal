import type { CodegenConfig } from '@graphql-codegen/cli';

const { CODEGEN_ENV = 'production' } = process.env;

const canonicalMockSchema = [
  '../../rfc/graphql-schema/b2b-full-schema.graphql',
  '../../rfc/graphql-schema/additionalTypeDefs/**/*.ts',
  '!../../rfc/graphql-schema/additionalTypeDefs/index.ts',
];

const schemaExtensionsCompatibilityConfig = {
  schemaExtensions: { schemaExtensions: {}, types: {} },
};

const gqlShim = `/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

const documents: Record<string, unknown> = {};
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * \`\`\`ts
 * const query = gql(\`query GetUser($id: ID!) { user(id: $id) { name } }\`);
 * \`\`\`
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown;

export function gql(source: string) {
  return documents[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<unknown, unknown>> =
  TDocumentNode extends DocumentNode<infer TType, unknown> ? TType : never;
`;

const envs: Record<string, { schema: string | string[] }> = {
  local: {
    schema: 'http://localhost:9000/graphql',
  },
  mock: {
    schema: canonicalMockSchema,
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
  documents: ['src/shared/service/**/*.ts'],
  allowPartialOutputs: CODEGEN_ENV === 'mock',
  generates: {
    './src/types/gql/graphql.ts': {
      plugins: [
        { add: { content: '/* eslint-disable */' } },
        { typescript: { inputMaybeValue: 'T | null | undefined' } },
        'typescript-operations',
        'typed-document-node',
      ],
      config: {
        ...schemaExtensionsCompatibilityConfig,
      },
    },
    './src/types/gql/gql.ts': {
      plugins: [{ add: { content: gqlShim } }],
      config: {
        ...schemaExtensionsCompatibilityConfig,
      },
    },
  },
  ignoreNoDocuments: true,
};

export default config;
