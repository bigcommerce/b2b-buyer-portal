import { useMemo, useReducer } from 'react';

import { GlobalProviderProps, initState } from './config';

import { GlobalContext, reducer } from './index';

export default function GlobalProvider(props: GlobalProviderProps) {
  const [state, dispatch] = useReducer(reducer, initState);

  const { children } = props;

  const GlobalValue = useMemo(
    () => ({
      state,
      dispatch,
    }),
    [state],
  );

  return <GlobalContext.Provider value={GlobalValue}>{children}</GlobalContext.Provider>;
}
