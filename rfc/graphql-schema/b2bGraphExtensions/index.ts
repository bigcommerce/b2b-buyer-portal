import { createYoga, createSchema } from 'graphql-yoga'
import http from 'http'

const typeDefs = /* GraphQL */ `
  type Site {
    proofOfExtension: String!
  }
  type Query {
    site: Site!
  }
`

const resolvers = {
  Query: {
    site: () => ({
      proofOfExtension: 'yep, the storefront graph was extended!',
    }),
  },
}

const yoga = createYoga({ schema: createSchema({ typeDefs, resolvers }) })

const server = http.createServer(yoga)

server.listen(4040, () => {
  console.log(
    'B2B GraphQL Extensions for Storefront running at http://localhost:4040'
  )
})
