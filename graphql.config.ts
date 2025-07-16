export default {
  schema: [
    'rfc/graphql-schema/supergraph.graphql',
    'rfc/graphql-schema/additionalTypeDefs/**/*.ts',
  ],
  documents: 'app/**/*.{graphql,js,ts,jsx,tsx}',
}
