export default {
  schema: [
    'rfc/graphql-schema/supergraph.graphql',
    'rfc/graphql-schema/additionalTypeDefs/**/*.ts',
  ],
  documents: 'apps/**/*.{graphql,js,ts,jsx,tsx}',
}
