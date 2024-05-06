import { createContext } from 'react';

import { GlobalAction, GlobalContext, GlobalState, initState } from './config';

export const GlobaledContext = createContext<GlobalContext>({
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
