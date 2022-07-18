import { b3Fetch, interceptors } from './fetch'

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

function queryParse<T>(query: T): string {
  let queryText: string = ''

  Object.keys(query).forEach((key: string) => {
    queryText += `${key}=${(query as any)[key]}&`
  })
  return queryText.slice(0, -1)
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

function request<T>(path: string, config?: T) {
  const init = {
    headers: {
      'content-type': 'application/json',
    },
    ...config,
  }
  const url = `https://dev-v2.bundleb2b.net/api${path}`
  return b3Fetch(url, init)
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
  const graphqlB2BUrl = 'https://dev-v2.bundleb2b.net/api/graphql'
  const graphqlBCUrl = ''

  const url = type === 'B2BGraphq' ? graphqlB2BUrl : graphqlBCUrl

  return b3Fetch(url, init, type)
}

export const B3Request = {
  graphqlB2B: function post<T>(data: T) {
    return graphqlRequest('B2BGraphq', data)
  },
  graphqlBC: function post<T>(data: T) {
    return graphqlRequest('BCGraphq', data)
  },
  get: function get<T>(url: string, data?: T) {
    if (data) {
      const params = queryParse(data)
      return request(`${url}?${params}`, { method: 'GET' })
    }
    return request(url, { method: 'GET' })
  },
  post: function post<T, Y>(path: string, data: T, config?: Y) {
    return request(path, {
      body: JSON.stringify(data),
      method: 'POST',
      ...config,
    })
  },
}
