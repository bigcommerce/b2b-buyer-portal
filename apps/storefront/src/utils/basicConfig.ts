import globalB3 from '@b3/global-b3'

export const storeHash = globalB3?.setting?.store_hash

export const channelId = Number.isInteger(globalB3?.setting?.channel_id)
  ? globalB3?.setting?.channel_id
  : Number.parseInt(globalB3?.setting?.channel_id, 10)
