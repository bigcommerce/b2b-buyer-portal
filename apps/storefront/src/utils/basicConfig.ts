import globalB3 from '@b3/global-b3'

import { store } from '@/store'

export const storeHash = globalB3?.setting?.store_hash

export const channelId = Number.isInteger(globalB3?.setting?.channel_id)
  ? globalB3?.setting?.channel_id
  : Number.parseInt(globalB3?.setting?.channel_id, 10)

export const bcBaseUrl = () => {
  const {
    global: { bcUrl },
  } = store.getState()

  const isLocalDebugging = globalB3?.setting?.is_local_debugging

  return isLocalDebugging ? '/bigcommerce' : bcUrl
}
