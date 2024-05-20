declare interface CustomFieldItems {
  [key: string]: any;
}

declare interface CustomFieldStringItems {
  [key: string]: string;
}

type ChannelPlatform =
  | 'bigcommerce'
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
  b3Tipmessage: any;
  globalTipDispatch: any;
  B3: {
    setting: {
      channel_id: number;
      store_hash: string;
      platform: ChannelPlatform;
      b2b_url: string;
      captcha_setkey: string;
    };
  };
  /**
   * B3Local will be removed soon, this is just to TS warns you if you add more variables to it
   */
  B3Local?: import('@b3/global-b3').B3Local;
  b2b: {
    initializationEnvironment: import('./load-functions').InitializationEnvironment;
    callbacks: import('@/utils/b3Callbacks').default;
    utils: {
      openPage: (page: import('./constants').HeadlessRoute) => void;
      quote: {
        addProductFromPage: (item: import('@/utils').LineItems) => void;
        addProductsFromCart: () => Promise<void>;
        addProducts: (items: import('@/utils').LineItems[]) => Promise<void>;
        getCurrent: () => {
          productList: import('@/components').FormattedQuoteItem[];
        };
        getButtonInfo: () => import('@/shared/customStyleButtton/context/config').BtnProperties;
        getButtonInfoAddAllFromCartToQuote: () => import('@/shared/customStyleButtton/context/config').BtnProperties;
      };
      user: {
        getProfile: () => Record<string, string | number>;
        getMasqueradeState: () => Promise<{
          current_company_id: number;
          companies: CustomFieldStringItems[];
        }>;
        getB2BToken: () => string;
        setMasqueradeCompany: (companyId: number) => void;
        endMasquerade: () => void;
        graphqlBCProxy: typeof import('@/shared/service/request/b3Fetch').default.graphqlBCProxy;
        loginWithB2BStorefrontToken: (b2bStorefrontJWTToken: string) => Promise<void>;
      };
      shoppingList: {
        itemFromCurrentPage: import('@/components').ProductMappedAttributes;
        addProductFromPage: (item: import('@/utils').LineItems) => void;
        addProducts: (shoppingListId: number, items: import('@/utils').LineItems[]) => void;
        createNewShoppingList: (
          name: string,
          description: string,
        ) => Promise<{ id: number; name: string; description: string }>;
        getButtonInfo: () => import('@/shared/customStyleButtton/context/config').BtnProperties;
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
