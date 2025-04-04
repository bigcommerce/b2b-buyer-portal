import { useMemo, useReducer } from 'react';

import { GlobalProviderProps, initState as defaultInitState } from './config';
import { GlobalContext, reducer } from './index';

export default function GlobalProvider(props: GlobalProviderProps) {
  const { children, initState } = props;

  const [state, dispatch] = useReducer(reducer, { ...defaultInitState, ...initState });

  const GlobalValue = useMemo(
    () => ({
      state,
      dispatch,
    }),
    [state],
  );

  return <GlobalContext.Provider value={GlobalValue}>{children}</GlobalContext.Provider>;
}
