import { createSelector } from '@reduxjs/toolkit'

import { RootState } from './reducer'

const themeSelector = (state: RootState) => state.theme
// More selectors will be added
// eslint-disable-next-line
export const themeFrameSelector = createSelector(
  themeSelector,
  (theme) => theme.themeFrame
)
