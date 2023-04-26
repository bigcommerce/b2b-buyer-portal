import B3Request from '../../request/b3Fetch'

const BcCurrencies = () => `{
  site{
    currencies{
      edges{
        node{
          isActive
          entityId
        }
      }
    }
  }
}`

const getActiveBcCurrency = (): CustomFieldItems =>
  B3Request.graphqlBC({
    query: BcCurrencies(),
  })

export default getActiveBcCurrency
