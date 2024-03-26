import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'

import global from './slices/global'
import lang from './slices/lang'
import theme from './slices/theme'

export const middlewareOptions = {
  serializableCheck: {
    ignoredActions: [
      'theme/setThemeFrame',
      'global/setGlabolCommonState',
      'global/setOpenPageReducer',
    ],
    ignoredPaths: [
      'theme.themeFrame',
      'global.globalMessage',
      'global.setOpenPageFn',
    ],
  },
}

export const store = configureStore({
  reducer: {
    global,
    lang,
    theme,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(middlewareOptions),
})

export type AppStore = typeof store
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
