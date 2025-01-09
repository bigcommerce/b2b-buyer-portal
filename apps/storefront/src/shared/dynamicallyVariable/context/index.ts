import { createContext } from 'react';

import {
  DynamicallyVariableAction,
  DynamicallyVariableContextInterface,
  DynamicallyVariableState,
  initState,
} from './config';

export const DynamicallyVariableContext = createContext<DynamicallyVariableContextInterface>({
  state: initState,
  dispatch: () => {},
});

export const reducer = (
  state: DynamicallyVariableState,
  action: Partial<DynamicallyVariableAction>,
) => {
  const currentAction = action;
  const setMulTip = () => {
    if (currentAction.type === 'tip' && currentAction.payload?.tipMessage) {
      const msgs = state?.tipMessage?.msgs || [];

      const {
        tipMessage: { msgs: newMsgs = [] },
      } = currentAction.payload;

      currentAction.payload.tipMessage.msgs = [...msgs, ...newMsgs];

      return currentAction.payload;
    }

    if (currentAction.type === 'globalTip' && currentAction.payload?.globalTipMessage) {
      const msgs = state?.globalTipMessage?.msgs || [];

      const {
        globalTipMessage: { msgs: newMsgs = [] },
      } = currentAction.payload;

      currentAction.payload.globalTipMessage.msgs = [...msgs, ...newMsgs];

      return action.payload;
    }

    return {};
  };

  const mulTip = setMulTip();

  switch (action.type) {
    case 'common':
      return {
        ...state,
        ...action.payload,
      };
    case 'tip':
      return {
        ...state,
        ...mulTip,
      };
    case 'globalTip':
      return {
        ...state,
        ...mulTip,
      };
    default:
      return state;
  }
};
