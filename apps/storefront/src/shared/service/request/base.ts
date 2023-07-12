const { VITE_B2B_URL } = import.meta.env

const B2B_BASIC_URL = VITE_B2B_URL

enum RequestType {
  B2BGraphql = 'B2BGraphql',
  BCGraphql = 'BCGraphql',
  BCProxyGraphql = 'BCProxyGraphql',
  B2BRest = 'B2BRest',
  BCRest = 'BCRest',
}

const queryParse = <T>(query: T): string => {
  let queryText = ''

  Object.keys(query || {}).forEach((key: string) => {
    queryText += `${key}=${(query as any)[key]}&`
  })
  return queryText.slice(0, -1)
}

export { B2B_BASIC_URL, queryParse, RequestType }
