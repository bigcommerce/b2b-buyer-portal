import globalB3 from '@b3/global-b3'

const B2B_BASIC_URL = globalB3?.setting?.b2b_url

enum RequestType {
  B2BGraphql = 'B2BGraphql',
  BCGraphql = 'BCGraphql',
  B2BRest = 'B2BRest',
  BCRest = 'BCRest',
}

const queryParse = <T>(query: T): string => {
  let queryText: string = ''

  Object.keys(query).forEach((key: string) => {
    queryText += `${key}=${(query as any)[key]}&`
  })
  return queryText.slice(0, -1)
}

export {
  B2B_BASIC_URL,
  RequestType,
  queryParse,
}
