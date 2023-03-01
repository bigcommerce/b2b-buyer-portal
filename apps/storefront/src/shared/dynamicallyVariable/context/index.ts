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
  const setMulTip = () => {
    if (action.type === 'tip' && action.payload?.tipMessage) {
      const msgs = state?.tipMessage?.msgs || []

      const {
        tipMessage: {
          msgs: newMsgs = [],
        },
      } = action.payload

      action.payload.tipMessage.msgs = [...msgs, ...newMsgs]

      return action.payload
    }

    return {}
  }

  const mulTip = setMulTip()

  switch (action.type) {
    case 'common':
      return {
        ...state,
        ...action.payload,
      }
    case 'tip':
      return {
        ...state,
        ...mulTip,
      }
    default:
      return state
  }
}
