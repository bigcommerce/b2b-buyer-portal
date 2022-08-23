import {
  createContext,
} from 'react'

import {
  GlobalContext,
  initState,
  GlobalState,
  GlobalAction,
} from './config'

export const GlobaledContext = createContext<GlobalContext>({
  state: initState,
  dispatch: () => {},
})

export const reducer = (state: GlobalState, action: Partial<GlobalAction>) => {
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
