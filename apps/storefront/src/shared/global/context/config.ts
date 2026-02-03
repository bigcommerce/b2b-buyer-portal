import { Dispatch, ReactNode } from 'react';

import { TipMessagesProps } from '@/shared/dynamicallyVariable/context/config';
import { B3SStorage } from '@/utils/b3Storage';

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

export interface QuoteConfigProps {
  key: string;
  value: string;
  extraFields: CustomFieldItems;
}

interface OpenAPPParamsProps {
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
  addressConfig?: Array<{
    key: string;
    isEnabled: string;
  }>;
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
  type: 'common' | 'tip';
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
