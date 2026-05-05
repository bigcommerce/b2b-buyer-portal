import type { CodegenConfig } from '@graphql-codegen/cli';

const { CODEGEN_ENV = 'production' } = process.env;

const canonicalMockSchema = [
  '../../rfc/graphql-schema/b2b-full-schema.graphql',
  '../../rfc/graphql-schema/additionalTypeDefs/**/*.ts',
];

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
  generates: {
    './src/types/gql/': {
      preset: 'client',
      presetConfig: {
        gqlTagName: 'gql',
      },
    },
  },
  ignoreNoDocuments: true,
};

export default config;
