declare interface CustomFieldItems {
  [key: string]: any;
}

declare interface CustomFieldStringItems {
  [key: string]: string;
}

type ChannelPlatform =
  | 'bigcommerce'
  // cSpell:ignore acquia
  | 'acquia'
  | 'bloomreach'
  | 'catalyst'
  | 'deity'
  | 'drupal'
  | 'gatsby'
  | 'next'
  | 'vue'
  | 'wordpress'
  | 'custom';

declare interface Window {
  tipDispatch: import('@/shared/global/context/config.ts').DispatchProps;
  globalTipDispatch: any;
  B3: {
    setting: {
      channel_id: number;
      store_hash: string;
      platform: ChannelPlatform;
      environment: import('@/types/global').Environment;
      disable_logout_button?: boolean;
      cart_url?: string;
    };
  };
  b2b: {
    __get_asset_location: (filename: string) => string;
    initializationEnvironment: import('./load-functions').InitializationEnvironment;
    callbacks: import('@/utils/b3CallbackManager').default;
    utils: {
      openPage: (page: import('./constants').HeadlessRoute) => void;
      getRoutes: () => import('@/shared/routeList').BuyerPortalRoute[];
      quote: {
        addProductFromPage: (item: import('@/utils').LineItems) => void;
        addProductsFromCart: () => Promise<void>;
        addProducts: (items: import('@/utils').LineItems[]) => Promise<void>;
        getQuoteConfigs: () => import('@/shared/global/context/config').QuoteConfigProps[];
        getCurrent: () => {
          productList: import('@/components').FormattedQuoteItem[];
        };
        getButtonInfo: () => import('@/shared/customStyleButton/context/config').BtnProperties;
        getButtonInfoAddAllFromCartToQuote: () => import('@/shared/customStyleButton/context/config').BtnProperties;
      };
      user: {
        getProfile: () => Record<string, any>;
        getMasqueradeState: () => Promise<{
          current_company_id: number;
          companies: CustomFieldStringItems[];
        }>;
        getB2BToken: () => string;
        setMasqueradeCompany: (companyId: number) => void;
        endMasquerade: () => void;
        graphqlBCProxy: typeof import('@/shared/service/request/b3Fetch').default.graphqlBCProxy;
        loginWithB2BStorefrontToken: (b2bStorefrontJWTToken: string) => Promise<void>;
        logout: () => Promise<void>;
      };
      shoppingList: {
        itemFromCurrentPage: import('@/components').ProductMappedAttributes;
        addProductFromPage: (item: import('@/utils').LineItems) => void;
        addProducts: (shoppingListId: number, items: import('@/utils').LineItems[]) => void;
        createNewShoppingList: (
          name: string,
          description: string,
        ) => Promise<{ id: number; name: string; description: string }>;
        getButtonInfo: () => import('@/shared/customStyleButton/context/config').BtnProperties;
      };
      cart: {
        setEntityId: (entityId: string) => void;
        getEntityId: () => undefined | string;
      };
    };
  };
}

declare interface CurrencyProps {
  token: string;
  location: string;
  currencyCode: string;
  decimalToken: string;
  decimalPlaces: number;
  thousandsToken: string;
  currencyExchangeRate: string;
}
