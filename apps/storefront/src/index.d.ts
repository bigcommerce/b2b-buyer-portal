declare interface CustomFieldItems {
  [key: string]: any
}

declare interface CustomFieldStringItems {
  [key: string]: string
}

declare interface Window {
  tipDispatch: import('@/shared/global/context/config.ts').DispatchProps
  b3Tipmessage: any
  globalTipDispatch: any
  B3Local: any
  b2b: {
    initializationEnvironment: import('./load-functions').InitializationEnvironment
    callbacks: import('@/utils/b3Callbacks').default
    utils: {
      openPage: (page: import('./constants').HeadlessRoute) => void
      quote: {
        addProductFromPage: (item: import('@/utils').LineItems) => void
        addProductsFromCart: () => Promise<void>
        addProducts: (items: import('@/utils').LineItems[]) => Promise<void>
        getCurrent: () => {
          productList: import('@/components').FormatedQuoteItem[]
        }
        getButtonInfo: () => import('@/shared/customStyleButtton/context/config').BtnProperties
        getButtonInfoAddAllFromCartToQuote: () => import('@/shared/customStyleButtton/context/config').BtnProperties
      }
      user: {
        getProfile: () => Record<string, string | number>
        getMasqueradeState: () => Promise<{
          current_company_id: number
          companies: CustomFieldStringItems[]
        }>
        getB2BToken: () => string
        setMasqueradeCompany: (companyId: number) => Promise<void>
        endMasquerade: () => Promise<void>
        graphqlBCProxy: typeof import('@/shared/service/request/b3Fetch').default.graphqlBCProxy
        loginWithB2BStorefrontToken: (
          b2bStorefrontJWTToken: string
        ) => Promise<void>
      }
      shoppingList: {
        itemFromCurrentPage: import('@/components').ProductMappedAttributes
        addProductFromPage: (item: import('@/utils').LineItems) => void
        addProducts: (
          shoppingListId: number,
          items: import('@/utils').LineItems[]
        ) => void
        createNewShoppingList: (
          name: string,
          description: string
        ) => Promise<{ id: number; name: string; description: string }>
        getButtonInfo: () => import('@/shared/customStyleButtton/context/config').BtnProperties
      }
    }
  }
}

declare interface CurrencyProps {
  token: string
  location: string
  currencyCode: string
  decimalToken: string
  decimalPlaces: number
  thousandsToken: string
  currencyExchangeRate: string
}
