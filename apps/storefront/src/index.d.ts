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

type Position =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'bottom-center';

interface ToastOptions {
  action?: {
    label: string;
    onClick: () => void;
  };
  description?: string;
  position?: Position;
  dismissLabel?: string;
}

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
  catalyst?: {
    toast: {
      error: (message: string, options?: ToastOptions) => void;
      success: (message: string, options?: ToastOptions) => void;
      info: (message: string, options?: ToastOptions) => void;
      warning: (message: string, options?: ToastOptions) => void;
    };
  };
  b2b: {
    __get_asset_location: (filename: string) => string;
    initializationEnvironment: import('./load-functions').InitializationEnvironment;
    callbacks: import('@/utils/b3CallbackManager').default;
    utils: {
      openPage: (page: import('./constants').HeadlessRoute) => void;
      getRoutes: () => import('@/shared/routeList').BuyerPortalRoute[];
      setConfig: (key: string, value: string) => void;
      quote: {
        addProductFromPage: (item: import('@/utils').LineItems) => void;
        addProductsFromCart: () => Promise<void>;
        addProductsFromCartId: (cartId: string) => Promise<void>;
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
        getLists: () => Promise<import('@/pages/ShoppingLists/config').ShoppingListsItemsProps[]>;
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

declare interface Window {
  b2b: {
    callbacks: {
      dispatchEvent: (
        callbackKey: import('@/hooks/useB2BCallback').EventType,

        data?: Record<string, any>,
      ) => boolean;
    };
  };
  b2b: {
    isInit: boolean;
  };
}
