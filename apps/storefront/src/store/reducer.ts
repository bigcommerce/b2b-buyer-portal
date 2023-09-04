import { setupStore } from '@b3/store'

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

export const store = setupStore({
  reducers: {
    global,
    theme,
    lang,
  },
  middlewareOptions,
})

export type AppStore = typeof store
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
