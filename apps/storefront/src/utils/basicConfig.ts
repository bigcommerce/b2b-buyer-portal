import globalB3 from '@b3/global-b3'

import { store } from '@/store'

const storeHash = globalB3?.setting?.store_hash

const bcBaseUrl = () => {
  const {
    global: { bcUrl },
  } = store.getState()

  const isLocalDebugging = globalB3?.setting?.is_local_debugging

  return isLocalDebugging ? '/bigcommerce' : bcUrl
}

export { bcBaseUrl, storeHash }
