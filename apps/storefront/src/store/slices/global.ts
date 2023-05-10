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

interface GlobalMessageDialog {
  open: boolean
  title: string
  message: string
  cancelText?: string
  cancelFn?: () => void
  saveText?: string
  saveFn?: () => void
}

export interface GlabolState {
  taxZoneRates?: TaxZoneRatesProps[]
  isClickEnterBtn?: boolean
  isPageComplete?: boolean
  globalMessage?: GlobalMessageDialog
  enteredInclusive?: boolean
}

const initialState: GlabolState = {
  taxZoneRates: [],
  isClickEnterBtn: false,
  isPageComplete: false,
  globalMessage: {
    open: false,
    title: '',
    message: '',
    cancelText: 'Cancel',
  },
  enteredInclusive: false,
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
    setEnteredInclusive: (state, { payload }: PayloadAction<boolean>) => {
      state.enteredInclusive = payload as Draft<boolean>
    },
  },
})

export const {
  clearglabol,
  setTaxZoneRates,
  setGlabolCommonState,
  setEnteredInclusive,
} = glabolSlice.actions

export default glabolSlice.reducer
