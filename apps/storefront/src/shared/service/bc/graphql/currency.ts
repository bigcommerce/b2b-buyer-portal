import B3Request from '../../request/b3Fetch';

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
}`;

const getActiveBcCurrency = () =>
  B3Request.graphqlBCProxy({
    query: BcCurrencies(),
  });

export default getActiveBcCurrency;
