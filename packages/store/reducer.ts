import {
  combineReducers,
  configureStore,
  PreloadedState,
  Reducer,
} from '@reduxjs/toolkit'
import { ToolkitStore } from '@reduxjs/toolkit/dist/configureStore'

import lang from './slices/lang'

type Reducers<Type> = Record<string, Reducer<Type>>
interface SetupStoreParams<Type> {
  reducers: any
  preloadedState?:
    | {
        [x: string]:
          | (Type extends object ? PreloadedState<Type> : Type)
          | undefined
      }
    | undefined
  middlewareOptions?: Record<string, any>
}
export interface CustomToolkitStore<Type> extends ToolkitStore {
  asyncReducers?: Reducers<Type>
  injectReducer?: (key: string, asyncReducer: Reducer<Type>) => void
}

const baseReducers = {
  lang,
}

const createReducer = <Type>(asyncReducers: Reducers<Type>) =>
  combineReducers({
    ...baseReducers,
    ...asyncReducers,
  })

export const setupStore = <S>(
  {
    reducers,
    preloadedState,
    middlewareOptions,
  }: SetupStoreParams<S> | undefined = {
    reducers: {},
  }
) => {
  const store: CustomToolkitStore<S> = configureStore({
    reducer: {
      ...baseReducers,
      ...reducers,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware(middlewareOptions),
  })

  store.injectReducer = (key: string, asyncReducer: Reducer<S>) => {
    if (!store.asyncReducers) {
      store.asyncReducers = {}
    }
    store.asyncReducers[key] = asyncReducer
    store.replaceReducer(createReducer(store.asyncReducers))
  }

  return store
}
