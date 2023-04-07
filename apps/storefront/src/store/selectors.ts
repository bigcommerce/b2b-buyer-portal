import {
  createSelector,
} from '@reduxjs/toolkit'
import {
  RootState,
} from './reducer'

const themeSelector = (state: RootState) => state.theme
export const themeFrameSelector = createSelector(themeSelector, (theme) => theme.themeFrame)
