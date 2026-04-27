import { platform } from '@/utils/basicConfig';

import B3Request from '../../request/b3Fetch';

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

const bcSiteLocales = `query {
  site {
    settings {
      locales {
        code
        isDefault
        fullPath
      }
    }
  }
}`;

export const getSiteLocales = () =>
  platform === 'bigcommerce'
    ? B3Request.graphqlBC({ query: bcSiteLocales })
    : B3Request.graphqlBCProxy({ query: bcSiteLocales });

export default getActiveBcCurrency;
