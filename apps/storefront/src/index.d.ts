import type { BtnProperties } from '@/shared/customStyleButton/context/config';
import type { DispatchProps, QuoteConfigProps } from '@/shared/global/context/config';
import type { B3RequestType } from '@/shared/service/request/b3Fetch';
import type { LineItem } from '@/utils/b3Product/b3Product';

import type { HeadlessRoute } from './constants';
import type { EventType } from './hooks/useB2BCallback';
import type { ShoppingListsItemsProps } from './pages/ShoppingLists/config';
import type { BuyerPortalRoute } from './shared/routeList';
import type CallbackManager from './utils/b3CallbackManager';
import type { FormattedQuoteItem, ProductMappedAttributes } from './HeadlessController';
import type { InitializationEnvironment } from './load-functions';

declare global {
  /** @deprecated Please avoid using this interface */
  type CustomFieldItems = Record<string, any>;

  /** @deprecated Please avoid using this interface */
  type CustomFieldStringItems = Record<string, string>;

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

  interface Window {
    tipDispatch: DispatchProps;
    globalTipDispatch: any;
    B3: {
      setting: {
        channel_id: number;
        store_hash: string;
        platform: ChannelPlatform;
        environment: string;
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
      initializationEnvironment: InitializationEnvironment;
      callbacks: CallbackManager;
      utils: {
        openPage: (page: HeadlessRoute) => void;
        getRoutes: () => BuyerPortalRoute[];
        setConfig: (key: string, value: string) => void;
        quote: {
          addProductFromPage: (item: LineItem) => void;
          addProductsFromCart: () => Promise<void>;
          addProductsFromCartId: (cartId: string) => Promise<void>;
          addProducts: (items: LineItem[]) => Promise<void>;
          getQuoteConfigs: () => QuoteConfigProps[];
          getCurrent: () => {
            productList: FormattedQuoteItem[];
          };
          getButtonInfo: () => BtnProperties;
          getButtonInfoAddAllFromCartToQuote: () => BtnProperties;
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
          graphqlBCProxy: B3RequestType['graphqlBCProxy'];
          loginWithB2BStorefrontToken: (b2bStorefrontJWTToken: string) => Promise<void>;
          logout: () => Promise<void>;
        };
        shoppingList: {
          itemFromCurrentPage: ProductMappedAttributes;
          addProductFromPage: (item: LineItem) => void;
          addProducts: (shoppingListId: number, items: LineItem[]) => void;
          createNewShoppingList: (
            name: string,
            description: string,
          ) => Promise<{ id: number; name: string; description: string }>;
          getButtonInfo: () => BtnProperties;
          getLists: () => Promise<ShoppingListsItemsProps[]>;
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
        dispatchEvent: (callbackKey: EventType, data?: Record<string, any>) => boolean;
      };
      isInit: boolean;
    };
  }
}
