import {
  useReducer,
  useMemo,
} from 'react'

import {
  GlobaledContext,
  reducer,
} from './index'

import {
  GlobaledProviderProps,
  initState,
} from './config'

export function GlobalProvider(props: GlobaledProviderProps) {
  const [state,
    dispatch] = useReducer(reducer, initState)

  const {
    children,
  } = props

  const GlobalValue = useMemo(() => ({
    state,
    dispatch,
  }), [state])

  return (
    <GlobaledContext.Provider value={GlobalValue}>
      {children}
    </GlobaledContext.Provider>
  )
}
