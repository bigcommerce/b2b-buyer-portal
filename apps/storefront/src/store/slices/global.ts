import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice, Draft } from '@reduxjs/toolkit'

export interface TaxZoneRates {
  rate?: number
  taxClassId?: number
}

interface Rates {
  enabled: boolean
  id: number
  name: string
  priority: number
  classRates: TaxZoneRates[]
}

export interface TaxZoneRatesProps {
  enabled: boolean
  id: number
  name: string
  rates: Rates[]
}

export interface GlabolState {
  taxZoneRates?: TaxZoneRatesProps[]
  isClickEnterBtn?: boolean
  isPageComplete?: boolean
}

const initialState: GlabolState = {
  taxZoneRates: [],
  isClickEnterBtn: false,
  isPageComplete: false,
}

export const glabolSlice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    clearglabol: () => initialState,
    setTaxZoneRates: (
      state,
      { payload }: PayloadAction<TaxZoneRatesProps[]>
    ) => {
      state.taxZoneRates = payload as Draft<TaxZoneRatesProps[]>
    },
    setGlabolCommonState: (state, { payload }: PayloadAction<GlabolState>) => ({
      ...state,
      ...payload,
    }),
  },
})

export const { clearglabol, setTaxZoneRates, setGlabolCommonState } =
  glabolSlice.actions

export default glabolSlice.reducer
