import {
  combineReducers,
  configureStore,
  ImmutableStateInvariantMiddlewareOptions,
  PreloadedState,
  Reducer,
  SerializableStateInvariantMiddlewareOptions,
} from '@reduxjs/toolkit'
import { ToolkitStore } from '@reduxjs/toolkit/dist/configureStore'

type Reducers<Type> = { [x: string]: Type }
interface SetupStoreParams<Type> {
  reducers: Reducers<Type>
  preloadedState?: {
    [x: string]: (Type extends object ? PreloadedState<Type> : Type) | undefined
  }
  middlewareOptions?: Record<
    string,
    | ImmutableStateInvariantMiddlewareOptions
    | SerializableStateInvariantMiddlewareOptions
  >
}
export interface CustomToolkitStore<T, S> extends ToolkitStore {
  asyncReducers?: Reducers<T>
  injectReducer?: (key: string, asyncReducer: S) => void
}

const baseReducers = {}

export const setupStore = <T extends Reducer, S extends T>({
  reducers,
  preloadedState,
  middlewareOptions,
}: SetupStoreParams<T>) => {
  const store: CustomToolkitStore<T, S> = configureStore({
    reducer: {
      ...baseReducers,
      ...reducers,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware(middlewareOptions),
  })

  store.injectReducer = (key, asyncReducer) => {
    if (!store.asyncReducers) {
      store.asyncReducers = {}
    }
    store.asyncReducers[key] = asyncReducer
    store.replaceReducer(
      combineReducers({
        ...baseReducers,
        ...store.asyncReducers,
      })
    )
  }

  return store
}
