import { createSelector } from '@reduxjs/toolkit'

import { RootState } from './reducer'

const themeSelector = (state: RootState) => state.theme
const storeConfigSelector = (state: RootState) => state.storeConfigs

export const themeFrameSelector = createSelector(
  themeSelector,
  (theme) => theme.themeFrame
)

export const defaultCurrencyCodeSelector = createSelector(
  storeConfigSelector,
  (storeConfigs) =>
    storeConfigs.currencies.currencies.find((currency) => currency.is_default)
)
