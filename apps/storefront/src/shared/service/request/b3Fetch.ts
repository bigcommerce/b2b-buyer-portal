import { B3SStorage, getCookie } from '@/utils'
import { bcBaseUrl } from '@/utils/basicConfig'

import { B2B_BASIC_URL, queryParse, RequestType, RequestTypeKeys } from './base'
import b3Fetch from './fetch'

interface Config {
  headers?: {
    [key: string]: string
  }
}
const GraphqlEndpointsFn = (type: RequestTypeKeys): string => {
  const GraphqlEndpoints: CustomFieldStringItems = {
    B2BGraphql: `${B2B_BASIC_URL}/graphql`,
    BCGraphql: `${bcBaseUrl()}/graphql`,
    BCProxyGraphql: `${B2B_BASIC_URL}/api/v3/proxy/bc-storefront/graphql`,
  }

  return GraphqlEndpoints[type] || ''
}

function request<T>(path: string, config?: T & Config, type?: RequestTypeKeys) {
  const url = RequestType.B2BRest === type ? `${B2B_BASIC_URL}${path}` : path
  const getToken =
    type === RequestType.BCRest
      ? {
          'x-xsrf-token': getCookie('XSRF-TOKEN'),
        }
      : {
          authToken: `${B3SStorage.get('B2BToken') || ''}`,
        }

  const {
    headers = {
      'content-type': 'application/json',
    },
  } = config || {}

  const init = {
    ...config,
    headers: {
      ...headers,
      ...getToken,
    },
  }
  return b3Fetch(url, init, type)
}

function graphqlRequest<T, Y>(
  type: RequestTypeKeys,
  data: T,
  config?: Y,
  customMessage = false
) {
  const init = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...config,
    },
    body: JSON.stringify(data),
  }

  const url = GraphqlEndpointsFn(type)
  return b3Fetch(url, init, type, customMessage)
}

const B3Request = {
  /**
   * Request to B2B graphql API using B2B token
   */
  graphqlB2B: function post<T>(data: T, customMessage = false): Promise<any> {
    const config = {
      Authorization: `Bearer  ${B3SStorage.get('B2BToken') || ''}`,
    }
    return graphqlRequest(RequestType.B2BGraphql, data, config, customMessage)
  },
  /**
   * super admin / pending company
   * Request to B2B graphql API using BC JWT Token
   */
  graphqlB2BWithBCCustomerToken: function post<T>(
    data: T,
    customMessage = false
  ): Promise<any> {
    const config = {
      Authorization: `Bearer  ${
        B3SStorage.get('currentCustomerJWTToken') || ''
      }`,
    }
    return graphqlRequest(RequestType.B2BGraphql, data, config, customMessage)
  },
  /**
   * @deprecated use {@link B3Request.graphqlBCProxy} instead
   * Request to BC graphql API using BC graphql token
   */
  graphqlBC: function post<T>(data: T): Promise<any> {
    const config = {
      Authorization: `Bearer  ${B3SStorage.get('bcGraphqlToken') || ''}`,
    }
    return graphqlRequest(RequestType.BCGraphql, data, config)
  },
  /**
   * Request to BC graphql API using B2B token
   */
  graphqlBCProxy: function post<T>(data: T): Promise<any> {
    const config = {
      Authorization: `Bearer  ${B3SStorage.get('B2BToken') || ''}`,
    }
    return graphqlRequest(RequestType.BCProxyGraphql, data, config)
  },
  get: function get<T, Y>(
    url: string,
    type: RequestTypeKeys,
    data?: T,
    config?: Y
  ): Promise<any> {
    if (data) {
      const params = queryParse(data)
      return request(`${url}?${params}`, {
        method: 'GET',
        ...config,
      })
    }
    return request(
      url,
      {
        method: 'GET',
      },
      type
    )
  },
  post: function post<T>(
    url: string,
    type: RequestTypeKeys,
    data: T
  ): Promise<any> {
    return request(
      url,
      {
        body: JSON.stringify(data),
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      },
      type
    )
  },
  put: function put<T>(
    url: string,
    type: RequestTypeKeys,
    data: T
  ): Promise<any> {
    return request(
      url,
      {
        body: JSON.stringify(data),
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
        },
      },
      type
    )
  },
  delete: function deleteFn(url: string, type: RequestTypeKeys): Promise<any> {
    return request(
      url,
      {
        method: 'DELETE',
      },
      type
    )
  },
  fileUpload: function fileUpload<T, Y>(
    url: string,
    formData: T,
    config?: Y
  ): Promise<any> {
    return request(`${B2B_BASIC_URL}${url}`, {
      method: 'POST',
      body: formData,
      headers: {},
      ...config,
    })
  },
}

export default B3Request
