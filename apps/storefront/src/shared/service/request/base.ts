import globalB3 from '@b3/global-b3'

// eslint-disable-next-line no-console
console.log(globalB3, 'globalB3')

const B2B_BASIC_URL = (window as any)?.b3?.setting?.B2B_URL || import.meta.env.VITE_B2B_BASIC_URL

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
