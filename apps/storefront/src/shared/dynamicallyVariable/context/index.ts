import {
  createContext,
} from 'react'

import {
  DynamicallyVariableContext,
  initState,
  DynamicallyVariableState,
  DynamicallyVariableAction,
} from './config'

export const DynamicallyVariableedContext = createContext<DynamicallyVariableContext>({
  state: initState,
  dispatch: () => {},
})

export const reducer = (state: DynamicallyVariableState, action: Partial<DynamicallyVariableAction>) => {
  switch (action.type) {
    case 'common':
      return {
        ...state,
        ...action.payload,
      }
    default:
      return state
  }
}
