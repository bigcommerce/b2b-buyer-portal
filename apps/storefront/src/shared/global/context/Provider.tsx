import { useMemo, useReducer } from 'react';

import { GlobaledProviderProps, initState } from './config';
import { GlobaledContext, reducer } from './index';

export default function GlobalProvider(props: GlobaledProviderProps) {
  const [state, dispatch] = useReducer(reducer, initState);

  const { children } = props;

  const GlobalValue = useMemo(
    () => ({
      state,
      dispatch,
    }),
    [state],
  );

  return <GlobaledContext.Provider value={GlobalValue}>{children}</GlobaledContext.Provider>;
}
