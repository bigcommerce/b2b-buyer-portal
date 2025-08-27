import { useMemo, useReducer } from 'react';

import { DynamicallyVariableProviderProps, initState } from './config';

import { DynamicallyVariableContext, reducer } from './index';

export default function DynamicallyVariableProvider(props: DynamicallyVariableProviderProps) {
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
    <DynamicallyVariableContext.Provider value={DynamicallyVariableValue}>
      {children}
    </DynamicallyVariableContext.Provider>
  );
}
