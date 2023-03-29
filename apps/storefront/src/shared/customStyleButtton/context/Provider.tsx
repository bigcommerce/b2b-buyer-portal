import {
  useReducer,
  useMemo,
} from 'react'

import {
  CustomStyleContext,
  reducer,
} from './index'

import {
  CustomStyleButtonProviderProps,
  initState,
} from './config'

export function CustomStyleProvider(props: CustomStyleButtonProviderProps) {
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
    <CustomStyleContext.Provider value={DynamicallyVariableValue}>
      {children}
    </CustomStyleContext.Provider>
  )
}
