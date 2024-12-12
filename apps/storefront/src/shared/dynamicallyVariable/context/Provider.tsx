import { useMemo, useReducer } from 'react';

import { DynamicallyVariedProviderProps, initState } from './config';
import { DynamicallyVariedContext, reducer } from './index';

export default function DynamicallyVariableProvider(props: DynamicallyVariedProviderProps) {
  const [state, dispatch] = useReducer(reducer, initState);

  const { children } = props;

  const DynamicallyVariableValue = useMemo(
    () => ({
      state,
      dispatch,
    }),
    [state],
  );

  return (
    <DynamicallyVariedContext.Provider value={DynamicallyVariableValue}>
      {children}
    </DynamicallyVariedContext.Provider>
  );
}
