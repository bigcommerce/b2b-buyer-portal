/// <reference types="./shared/global/context/config.ts" />
declare interface CustomFieldItems {
  [key: string]: any
}

declare interface CustomFieldStringItems {
  [key: string]: string | number
}

declare interface Window {
  tipDispatch: DispatchProps
  b3Tipmessage: any
  b2bStorefrontApp: any
  globalTipDispatch: any
  B3Local: any
}
