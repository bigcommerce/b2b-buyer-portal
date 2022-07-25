import globalB3 from '@b3/global-b3'

const storeHash = globalB3?.setting?.store_hash

const captchaSetkey = globalB3?.setting?.captcha_setkey

const isLocalDebugging = globalB3?.setting?.is_local_debugging

const bcBaseUrl = isLocalDebugging ? '/bigcommerce' : ''

export {
  storeHash,
  bcBaseUrl,
  captchaSetkey,
}
