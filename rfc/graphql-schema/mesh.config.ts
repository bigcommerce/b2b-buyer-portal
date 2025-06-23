import {
  defineConfig,
  loadGraphQLHTTPSubgraph,
} from '@graphql-mesh/compose-cli'

const storeHash = process.env.STORE_HASH
const bearerToken = process.env.STORE_OAUTH_TOKEN

const headers = {
  accept: 'application/json',
  'content-type': 'application/json',
  authorization: `Bearer ${bearerToken}`,
}

export const composeConfig = defineConfig({
  subgraphs: [
    {
      sourceHandler: loadGraphQLHTTPSubgraph('storefront', {
        endpoint: `https://store-${storeHash}.mybigcommerce.com/graphql`,
        schemaHeaders: headers,
        operationHeaders: headers,
      }),
    },
    {
      sourceHandler: loadGraphQLHTTPSubgraph('b2bGraphExtensions', {
        endpoint: `http://localhost:4040/graphql`,
      }),
    },
  ],
})
