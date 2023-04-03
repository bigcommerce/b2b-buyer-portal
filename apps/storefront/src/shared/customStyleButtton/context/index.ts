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
  const mergeState = () => {
    if (action.type === 'merge') {
      const obj: Partial<CustomStyleButtonState> = {}
      const {
        payload,
      } = action
      if (payload) {
        Object.keys(payload).forEach((key) => {
          (obj as CustomFieldItems)[key] = {
            ...(state as CustomFieldItems)[key],
            ...(payload as CustomFieldItems)[key],
          }
        })
        return obj
      }
      return {}
    }

    return action.payload
  }
  const newState = mergeState()

  switch (action.type) {
    case 'merge':
      return {
        ...state,
        ...newState,
      }
    default:
      return state
  }
}
