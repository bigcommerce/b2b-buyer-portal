import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist'

import company from './slices/company'
import b2bFeatures from './slices/b2bFeatures'
import global from './slices/global'
import lang from './slices/lang'
import storeConfigs from './slices/storeConfigs'
import theme from './slices/theme'

export const middlewareOptions = {
  serializableCheck: {
    ignoredActions: [
      FLUSH,
      REHYDRATE,
      PAUSE,
      PERSIST,
      PURGE,
      REGISTER,
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
    company,
    storeConfigs,
    theme,
    b2bFeatures,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(middlewareOptions),
})

export type AppStore = typeof store
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
export const persistor = persistStore(store)
