declare interface Window {
  b2b: {
    callbacks: {
      dispatchEvent: (
        callbackKey: import('./useCustomCallbacks').CallbackKey,
        data: any
      ) => boolean
    }
  }
  b2b: {
    isInit: boolean
  }
}
