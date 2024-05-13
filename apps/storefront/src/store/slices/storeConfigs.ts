import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { ActiveCurrency, Currencies } from '@/types';

export interface StoreConfigState {
  currencies: Currencies;
  activeCurrency?: ActiveCurrency;
}

export const defaultCurrenciesState: Currencies = {
  currencies: [
    {
      id: '1',
      is_default: true,
      last_updated: 'Tue, 18 Jul 2023 19:37:11 +0000',
      country_iso2: 'US',
      default_for_country_codes: ['USD'],
      currency_code: 'USD',
      currency_exchange_rate: '1.0000000000',
      name: 'United States Dollar',
      token: '$',
      auto_update: false,
      decimal_token: '.',
      decimal_places: 2,
      enabled: true,
      is_transactional: true,
      token_location: 'left',
      thousands_token: ',',
    },
  ],
  channelCurrencies: {
    channel_id: 1,
    enabled_currencies: ['USD'],
    default_currency: 'USD',
  },
  enteredInclusiveTax: false,
};

const initialState: StoreConfigState = {
  currencies: defaultCurrenciesState,
  activeCurrency: undefined,
};

export const storeConfigSlice = createSlice({
  name: 'storeConfigs',
  initialState,
  reducers: {
    clearState: () => initialState,
    setCurrencies: (state, { payload }: PayloadAction<Currencies>) => {
      state.currencies = payload;
    },
    setActiveCurrency: (state, { payload }: PayloadAction<ActiveCurrency>) => {
      state.activeCurrency = payload;
    },
    setEnteredInclusiveTax: (state, { payload }: PayloadAction<boolean>) => {
      state.currencies.enteredInclusiveTax = payload;
    },
  },
});

export const { clearState, setCurrencies, setActiveCurrency, setEnteredInclusiveTax } =
  storeConfigSlice.actions;

export default storeConfigSlice.reducer;
