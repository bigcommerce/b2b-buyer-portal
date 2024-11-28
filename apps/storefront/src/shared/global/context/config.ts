import { Dispatch, ReactNode } from 'react';

import { TipMessagesProps } from '@/shared/dynamicallyVariable/context/config';
import { B3SStorage } from '@/utils';

export interface CustomerInfo {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  customerGroupId?: number;
}

export type AlertTip = 'error' | 'info' | 'success' | 'warning';
export interface State {
  stateCode?: string;
  stateName?: string;
  id?: string;
}
export interface Country {
  countryCode: string;
  countryName: string;
  id?: string;
  states: State[];
}

export interface ChannelCurrenciesProps {
  channel_id: number;
  default_currency: string;
  enabled_currencies: Array<string>;
}

export interface QuoteConfigProps {
  key: string;
  value: string;
  extraFields: CustomFieldItems;
}

export interface CurrencyProps {
  auto_update: boolean;
  country_iso2: string;
  currency_code: string;
  currency_exchange_rate: string;
  decimal_places: number;
  decimal_token: string;
  default_for_country_codes: Array<string>;
  enabled: boolean;
  id: string;
  is_default: boolean;
  is_transactional: boolean;
  last_updated: string;
  name: string;
  thousands_token: string;
  token: string;
  token_location: 'left' | 'right';
}

export interface OpenAPPParamsProps {
  quoteBtn: string;
  shoppingListBtn: string;
}

export interface GlobalState {
  isCheckout: boolean;
  isCloseGotoBCHome: boolean;
  logo: string;
  isCompanyAccount: boolean;
  isAgenting: boolean;
  tipMessage: TipMessagesProps;
  addressConfig?: {
    key: string;
    isEnabled: string;
  }[];
  storefrontConfig?: {
    [k: string]:
      | boolean
      | {
          value: boolean;
          enabledStatus: boolean;
        };
    shoppingLists: boolean;
    tradeProfessionalApplication: boolean;
  };
  bcLanguage: string;
  storeEnabled: boolean;
  storeName: string;
  b2bChannelId: number;
  countriesList?: Country[];
  productQuoteEnabled: boolean;
  cartQuoteEnabled: boolean;
  shoppingListEnabled: boolean;
  registerEnabled: boolean;
  quoteConfig: QuoteConfigProps[];
  openAPPParams: OpenAPPParamsProps;
  showPageMask: boolean;
  enteredInclusiveTax: boolean;
  blockPendingAccountOrderCreation: boolean;
  quoteDetailHasNewMessages: boolean;
  shoppingListClickNode: HTMLElement | null;
  multiStorefrontEnabled: boolean;
}

export const initState: GlobalState = {
  isCheckout: false,
  isCloseGotoBCHome: false,
  isAgenting: B3SStorage.get('isAgenting') || false,
  logo: '',
  bcLanguage: 'en',
  isCompanyAccount: false,
  storeEnabled: false,
  storeName: '',
  b2bChannelId: 1,
  countriesList: [],
  productQuoteEnabled: false,
  cartQuoteEnabled: false,
  shoppingListEnabled: false,
  registerEnabled: true,
  quoteConfig: [],
  openAPPParams: {
    quoteBtn: '',
    shoppingListBtn: '',
  },
  showPageMask: false,
  enteredInclusiveTax: false,
  blockPendingAccountOrderCreation: B3SStorage.get('blockPendingAccountOrderCreation') || true,
  quoteDetailHasNewMessages: false,
  shoppingListClickNode: null,
  tipMessage: {},
  multiStorefrontEnabled: false,
};

export interface GlobalAction {
  type: string;
  payload: Partial<GlobalState>;
}

export type DispatchProps = Dispatch<Partial<GlobalAction>>;
export interface GlobalContextValue {
  state: GlobalState;
  dispatch: DispatchProps;
}

export interface GlobalProviderProps {
  children: ReactNode;
}
