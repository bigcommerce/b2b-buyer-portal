import { store } from '@/store';
import { platform } from '@/utils/basicConfig';

import B3Request from '../../request/b3Fetch';

export function storefrontGQLRequest<T = any>(data: {
  query: string;
  variables?: object;
}): Promise<T> {
  const { bcGraphqlToken } = store.getState().company.tokens;
  // Mirror the Stencil flow: once a storefront bearer token (from the storeFrontToken
  // mutation) is available, call BC Storefront directly via graphqlBC. The preceding
  // bcLogin call also uses this path, which sets a BC session cookie — together they
  // authenticate registerCompany without needing a proxy or custom headers.
  return platform === 'bigcommerce' || bcGraphqlToken
    ? B3Request.graphqlBC<T>(data)
    : B3Request.graphqlBCProxy<T>(data);
}
