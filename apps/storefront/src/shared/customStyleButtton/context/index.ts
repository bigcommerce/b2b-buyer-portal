import {
  createContext,
} from 'react'

import {
  CustomStyleButtonContext,
  initState,
  CustomStyleButtonState,
  CustomStyleButtonAction,
} from './config'

export const CustomStyleContext = createContext<CustomStyleButtonContext>({
  state: initState,
  dispatch: () => {},
})

export const reducer = (state: CustomStyleButtonState, action: Partial<CustomStyleButtonAction>) => {
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
