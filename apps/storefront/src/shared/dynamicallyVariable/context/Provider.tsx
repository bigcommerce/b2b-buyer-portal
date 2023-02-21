import {
  useReducer,
  useMemo,
} from 'react'

import {
  DynamicallyVariableedContext,
  reducer,
} from './index'

import {
  DynamicallyVariableedProviderProps,
  initState,
} from './config'

export function DynamicallyVariableProvider(props: DynamicallyVariableedProviderProps) {
  const [state,
    dispatch] = useReducer(reducer, initState)

  const {
    children,
  } = props

  const DynamicallyVariableValue = useMemo(() => ({
    state,
    dispatch,
  }), [state])

  return (
    <DynamicallyVariableedContext.Provider value={DynamicallyVariableValue}>
      {children}
    </DynamicallyVariableedContext.Provider>
  )
}
