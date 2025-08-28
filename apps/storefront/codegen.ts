import type { CodegenConfig } from '@graphql-codegen/cli';

const { CODEGEN_ENV = 'production' } = process.env;

const envs: Record<string, { schema: string }> = {
  local: {
    schema: 'http://localhost:9000/graphql',
  },
  production: {
    schema: 'https://api-b2b.bigcommerce.com/graphql',
  },
};

const config: CodegenConfig = {
  schema: envs[CODEGEN_ENV]!.schema,
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
