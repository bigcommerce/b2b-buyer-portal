import { PropsWithChildren, useMemo, useReducer } from 'react';

import { initState } from './config';
import { CustomStyleContext, reducer } from './index';

export default function CustomStyleProvider(props: PropsWithChildren) {
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
    <CustomStyleContext.Provider value={DynamicallyVariableValue}>
      {children}
    </CustomStyleContext.Provider>
  );
}
