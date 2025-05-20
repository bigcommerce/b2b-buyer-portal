export * from './selectors';
export * from './appAsyncThunks';
export * from './slices/global';
export * from './slices/lang';
export * from './slices/theme';
export * from './slices/b2bFeatures';
export * from './slices/quoteInfo';
export * from './slices/storeInfo';

import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector, useStore } from 'react-redux';
import { FLUSH, PAUSE, PERSIST, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist';

import { reducer } from './reducer';

export { reducer };

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
      'global/setGlobalCommonState',
      'global/setOpenPageReducer',
    ],
    ignoredPaths: ['theme.themeFrame', 'global.globalMessage', 'global.setOpenPageFn'],
  },
};

export function setupStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer,
    preloadedState,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware(middlewareOptions),
  });
}

/**
 * @deprecated use `useAppStore` instead
 */
export const store = setupStore();

export type RootState = ReturnType<typeof reducer>;
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore['dispatch'];

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppStore: () => AppStore = useStore;

// cspell:disable
export const persistor = persistStore(store);
// cspell:enable
