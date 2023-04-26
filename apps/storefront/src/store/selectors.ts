import { createSelector } from '@reduxjs/toolkit'

import { RootState } from './reducer'

const themeSelector = (state: RootState) => state.theme
const globalSelector = (state: RootState) => state.global

// More selectors will be added
// eslint-disable-next-line
export const themeFrameSelector = createSelector(
  themeSelector,
  (theme) => theme.themeFrame
)

export const globalStateSelector = createSelector(
  globalSelector,
  (state) => state.isLoadComplete
)
