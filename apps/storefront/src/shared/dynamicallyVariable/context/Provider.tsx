import { useMemo, useReducer } from 'react';

import { DynamicallyVariableedProviderProps, initState } from './config';
import { DynamicallyVariableedContext, reducer } from './index';

export default function DynamicallyVariableProvider(props: DynamicallyVariableedProviderProps) {
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
    <DynamicallyVariableedContext.Provider value={DynamicallyVariableValue}>
      {children}
    </DynamicallyVariableedContext.Provider>
  );
}
