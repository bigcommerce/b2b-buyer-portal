import { b3Fetch, interceptors } from './fetch'
import { B2B_BASIC_URL, RequestType, queryParse } from './base'

/**
 * config User-defined configuration items
 * @param withoutCheck Do not use the default interface status verification, directly return response
 * @param returnOrigin Whether to return the entire Response object, false only response.data
 * @param showError Whether to use a unified error reporting method for global errors
 * @param canEmpty Whether the transport parameter can be null
 * @param timeout Interface request timeout duration. The default value is 10 seconds
 */

 interface configDefaultProps {
  showError: Boolean,
  canEmpty: Boolean,
  returnOrigin: Boolean,
  withoutCheck: Boolean,
  timeout: Number,
}

interface ConfigValProps {
  [key:string]: any
}

type ConfigProps = undefined | ConfigValProps

const configDefault: configDefaultProps = {
  showError: true,
  canEmpty: false,
  returnOrigin: false,
  withoutCheck: false,
  timeout: 10000,
}

// request interceptor
interceptors.request.use((config: ConfigProps) => {
  const configTemp: ConfigProps = {
    ...configDefault,
    ...config,
  }
  return configTemp
})

interceptors.response.use(async (response: Response) => {
  if (response.status >= 200 && response.status < 300) {
    return response
  }
  return Promise.reject(response)
})

function request<T>(path: string, config?: T, type?: string) {
  const url = RequestType.B2BRest === type ? `${B2B_BASIC_URL}${path}` : path
  const init = {
    headers: {
      'content-type': 'application/json',
    },
    ...config,
  }
  return b3Fetch(url, init, type)
}

function graphqlRequest<T, Y>(type: string, data: T, config?: Y) {
  const init = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    ...config,
    body: JSON.stringify(data),
  }
  const graphqlB2BUrl = `${B2B_BASIC_URL}/graphql`

  const url = type === RequestType.B2BGraphql ? graphqlB2BUrl : ''

  return b3Fetch(url, init, type)
}

export const B3Request = {
  graphqlB2B: function post<T>(data: T) {
    return graphqlRequest(RequestType.B2BGraphql, data)
  },
  graphqlBC: function post<T>(data: T) {
    return graphqlRequest(RequestType.BCGraphql, data)
  },
  get: function get<T>(url: string, type: string, data?: T) {
    if (data) {
      const params = queryParse(data)
      return request(`${url}?${params}`, { method: 'GET' })
    }
    return request(url, { method: 'GET' }, type)
  },
  post: function post<T>(url: string, type: string, data: T) {
    return request(url, {
      body: JSON.stringify(data),
      method: 'POST',
    }, type)
  },
  fileUpload: function fileUpload<T, Y>(url: string, formData: T, config?: Y) {
    return request(`${B2B_BASIC_URL}${url}`, {
      method: 'POST',
      body: formData,
      headers: {},
      ...config,
    })
  },
}
