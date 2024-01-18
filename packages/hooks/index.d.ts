declare enum CallbackKey {
  onQuoteCreate = 'on-quote-create',
  onAddToShoppingList = 'on-add-to-shopping-list',
}

declare interface Window {
  b2b: {
    callbacks: {
      dispatchEvent: (callbackKey: CallbackKey, data: any) => boolean
    }
  }
  b2b: {
    isInit: boolean
  }
}
