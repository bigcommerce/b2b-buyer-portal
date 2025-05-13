import B3Request from '../../request/b3Fetch';
import { platform } from '@/utils';

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
  platform === 'bigcommerce'
    ? B3Request.graphqlBC({
        query: bcCurrencies,
      })
    : B3Request.graphqlBCProxy({
        query: bcCurrencies,
      });

export default getActiveBcCurrency;
