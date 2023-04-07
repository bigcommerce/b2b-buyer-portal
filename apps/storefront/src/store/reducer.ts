import {
  setupStore,
} from '@b3/store'
import theme from './slices/theme'

export const middlewareOptions = {
  serializableCheck: {
    ignoredActions: ['theme/setThemeFrame'],
    ignoredPaths: ['theme.themeFrame'],
  },
}

export const store = setupStore({
  reducers: {
    theme,
  },
  middlewareOptions,
})

export type AppStore = typeof store
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
