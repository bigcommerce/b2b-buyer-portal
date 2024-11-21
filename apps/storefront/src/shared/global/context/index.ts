import { createContext } from 'react';

import { GlobalAction, GlobalContextValue, GlobalState, initState } from './config';

export const GlobalContext = createContext<GlobalContextValue>({
  state: initState,
  dispatch: () => {},
});

export const reducer = (state: GlobalState, action: Partial<GlobalAction>) => {
  switch (action.type) {
    case 'common':
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
};
