import {
  Draft,
  createSlice,
} from '@reduxjs/toolkit'
import type {
  PayloadAction,
} from '@reduxjs/toolkit'

export interface TaxZoneRates {
  rate?: number,
  taxClassId?: number
}

interface Rates {
  enabled: boolean,
  id: number,
  name: string,
  priority: number,
  classRates: TaxZoneRates[],
}

export interface TaxZoneRatesProps {
  enabled: boolean,
  id: number,
  name: string,
  rates: Rates[]
}

export interface glabolState {
  taxZoneRates?: TaxZoneRatesProps[]
}

const initialState: glabolState = {
  taxZoneRates: [],
}

export const glabolSlice = createSlice({
  name: 'glabol',
  initialState,
  reducers: {
    clearglabol: () => initialState,
    setTaxZoneRates: (state, {
      payload,
    }: PayloadAction<TaxZoneRatesProps[]>) => {
      state.taxZoneRates = payload as Draft<TaxZoneRatesProps[]>
    },
  },
})

export const {
  clearglabol,
  setTaxZoneRates,
} = glabolSlice.actions

export default glabolSlice.reducer
