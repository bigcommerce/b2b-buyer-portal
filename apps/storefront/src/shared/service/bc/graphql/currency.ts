import { storefrontGQLRequest } from './client';

const bcCurrencies = `query {
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
  storefrontGQLRequest({
    query: bcCurrencies,
  });

export default getActiveBcCurrency;
