import globalB3 from '@b3/global-b3'

const storeHash = globalB3?.setting?.store_hash

const bcUrl = sessionStorage.getItem('sf-bcUrl')
  ? JSON.parse(sessionStorage.getItem('sf-bcUrl') || '')
  : ''

const isLocalDebugging = globalB3?.setting?.is_local_debugging

const bcBaseUrl = isLocalDebugging ? '/bigcommerce' : bcUrl

export { bcBaseUrl, storeHash }
