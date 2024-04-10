import { createSelector } from '@reduxjs/toolkit'

import { RootState } from './reducer'

const themeSelector = (state: RootState) => state.theme
const storeConfigSelector = (state: RootState) => state.storeConfigs
const b2bFeaturesSelector = (state: RootState) => state.b2bFeatures

export const themeFrameSelector = createSelector(
  themeSelector,
  (theme) => theme.themeFrame
)

export const defaultCurrencyCodeSelector = createSelector(
  storeConfigSelector,
  (storeConfigs) =>
    storeConfigs.currencies.currencies.find((currency) => currency.is_default)
)

export const isAgentingSelector = createSelector(
  b2bFeaturesSelector,
  (b2bFeatures) => b2bFeatures.isAgenting
)
