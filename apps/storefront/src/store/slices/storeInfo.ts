import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface TimeFormat {
  display: string
  export: string
  extendedDisplay: string
  offset: number
}

export interface StoreInfo {
  timeFormat: TimeFormat
}

const initialState: StoreInfo = {
  timeFormat: {
    display: '',
    export: '',
    extendedDisplay: '',
    offset: 0,
  },
}

export const storeInfoSlice = createSlice({
  name: 'storeInfo',
  initialState,
  reducers: {
    clearStoreInfo: () => initialState,
    setTimeFormat: (state, { payload }: PayloadAction<TimeFormat>) => {
      state.timeFormat = payload
    },
  },
})

export const { clearStoreInfo, setTimeFormat } = storeInfoSlice.actions

export default storeInfoSlice.reducer
