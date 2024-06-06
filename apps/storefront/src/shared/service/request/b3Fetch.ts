import Cookies from 'js-cookie';

import { store } from '@/store';
import { baseUrl, channelId, snackbar, storeHash } from '@/utils';

import { B2B_BASIC_URL, queryParse, RequestType, RequestTypeKeys } from './base';
import b3Fetch from './fetch';

const GraphqlEndpointsFn = (type: RequestTypeKeys): string => {
  const GraphqlEndpoints: CustomFieldStringItems = {
    B2BGraphql: `${B2B_BASIC_URL}/graphql`,
    BCGraphql: `${baseUrl}/graphql`,
    BCProxyGraphql: `${B2B_BASIC_URL}/api/v3/proxy/bc-storefront/graphql`,
  };

  return GraphqlEndpoints[type] || '';
};

function request(path: string, config?: RequestInit, type?: RequestTypeKeys) {
  const url = RequestType.B2BRest === type ? `${B2B_BASIC_URL}${path}` : path;
  const { B2BToken } = store.getState().company.tokens;
  const getToken: HeadersInit =
    type === RequestType.BCRest
      ? {
          'x-xsrf-token': Cookies.get('XSRF-TOKEN') ?? '',
        }
      : {
          authToken: `${B2BToken}`,
        };

  const {
    headers = {
      'content-type': 'application/json',
    },
  } = config || {};

  const init = {
    ...config,
    headers: {
      ...headers,
      ...getToken,
    },
  };
  return b3Fetch(url, init);
}

function graphqlRequest<T, Y>(type: RequestTypeKeys, data: T, config?: Y) {
  const init = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...config,
    },
    body: JSON.stringify(data),
  };

  const url = GraphqlEndpointsFn(type);
  return b3Fetch(url, init);
}

interface B2bGQLResponse {
  data: any;
  errors?: Array<{
    message: string;
    extensions: {
      code: number;
    };
  }>;
}

const B3Request = {
  /**
   * Request to B2B graphql API using B2B token
   */
  graphqlB2B: function post<T>(data: T, customMessage = false): Promise<any> {
    const { B2BToken } = store.getState().company.tokens;
    const config = {
      Authorization: `Bearer  ${B2BToken}`,
    };

    return graphqlRequest(RequestType.B2BGraphql, data, config).then((value: B2bGQLResponse) => {
      const error = value.errors?.[0];

      const message = error?.message;
      const extensions = error?.extensions;

      if (extensions?.code === 40101) {
        window.location.href = '#/login?loginFlag=3&showTip=false';

        if (message) {
          snackbar.error(message);
        }

        return new Promise(() => {});
      }

      if (message) {
        if (!customMessage) {
          snackbar.error(message);
        }

        throw new Error(message);
      }

      return value.data;
    });
  },
  /**
   * @deprecated use {@link B3Request.graphqlBCProxy} instead
   * Request to BC graphql API using BC graphql token
   */
  graphqlBC: function post<T>(data: T): Promise<any> {
    const { bcGraphqlToken } = store.getState().company.tokens;
    const config = {
      Authorization: `Bearer  ${bcGraphqlToken}`,
    };
    return graphqlRequest(RequestType.BCGraphql, data, config);
  },
  /**
   * Request to BC graphql API using B2B token
   */
  graphqlBCProxy: function post<T>(data: T): Promise<any> {
    let config = {};
    const { B2BToken } = store.getState().company.tokens;

    if (B2BToken) {
      config = {
        Authorization: `Bearer  ${B2BToken}`,
      };
    } else {
      config = {
        'Store-Hash': storeHash,
        'BC-Channel-Id': channelId,
      };
    }

    return graphqlRequest(RequestType.BCProxyGraphql, data, config);
  },
  get: function get<T, Y>(url: string, type: RequestTypeKeys, data?: T, config?: Y): Promise<any> {
    if (data) {
      const params = queryParse(data);
      return request(`${url}?${params}`, {
        method: 'GET',
        ...config,
      });
    }
    return request(
      url,
      {
        method: 'GET',
      },
      type,
    );
  },
  post: function post<T>(url: string, type: RequestTypeKeys, data: T): Promise<any> {
    return request(
      url,
      {
        body: JSON.stringify(data),
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      },
      type,
    );
  },
  put: function put<T>(url: string, type: RequestTypeKeys, data: T): Promise<any> {
    return request(
      url,
      {
        body: JSON.stringify(data),
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
        },
      },
      type,
    );
  },
  delete: function deleteFn(url: string, type: RequestTypeKeys): Promise<any> {
    return request(
      url,
      {
        method: 'DELETE',
      },
      type,
    );
  },
  fileUpload: function fileUpload<T extends FormData, Y>(
    url: string,
    formData: T,
    config?: Y,
  ): Promise<any> {
    return request(`${B2B_BASIC_URL}${url}`, {
      method: 'POST',
      body: formData,
      headers: {},
      ...config,
    });
  },
};

export default B3Request;
