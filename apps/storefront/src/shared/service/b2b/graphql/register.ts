// import {
//   graphql,
//   GraphQLSchema,
//   GraphQLObjectType,
//   GraphQLString,
// } from 'graphql'

import { B3Request } from '../../request/b3Fetch'

interface WindowItems extends Window {
  storeHash?: string;
}

interface CustomFieldItems {
  [key: string]: any
}

const storeHash = (window as WindowItems)?.storeHash || 'rtmh8fqr05'

const getCompanyExtraFields = () => `{
  companyExtraFields(storeHash: "${storeHash}") {
    fieldName,
    fieldType,
    isRequired,
    defaultValue,
    maximumLength,
    maximumLength,
    maximumValue,
    listOfValue,
  }
}`

const getRegisterLogo = () => `{
  quoteConfig(storeHash: "${storeHash}") {
    key,
    isEnabled
  }
}`

const getCompanyUserInfo = <T>(email: T) => `{
  companyUserInfo(storeHash:"${storeHash}", email:"${email}") {
    userType,
    userInfo {
      id
      phoneNumber
      lastName
      email
      firstName
    }
  }
}`

export const getB2BCompanyUserInfo = (email: string): CustomFieldItems => B3Request.graphqlB2B({ query: getCompanyUserInfo(email) })

export const getB2BRegisterLogo = (): CustomFieldItems => B3Request.graphqlB2B({ query: getRegisterLogo() })

export const getB2BRegisterCustomFields = (): CustomFieldItems => B3Request.graphqlB2B({ query: getCompanyExtraFields() })

// TODO: graphql
// const schema = new GraphQLSchema({
//   query: new GraphQLObjectType({
//     name: 'RootQueryType',
//     fields: {
//       hello: {
//         type: GraphQLString,
//         resolve() {
//           return `{
//             quoteConfig(storeHash: ${storeHash}) {
//               key,
//               isEnabled
//             }
//           }`
//         },
//       },
//     },
//   }),
// })

// const source = '{ hello }'

// graphql({ schema, source }).then((result) => {
//   // Prints
//   // {
//   //   data: { hello: "world" }
//   // }
//   console.log(result, '1122221212')
// })
