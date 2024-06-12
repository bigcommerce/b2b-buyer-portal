import { createContext, Dispatch, ReactNode, useMemo, useReducer } from 'react';

export interface ShoppingListDetailsState {
  id?: number;
  isLoading?: boolean;
}
interface ShoppingListDetailsAction {
  type: string;
  payload: ShoppingListDetailsState;
}
export interface ShoppingListDetailsContextType {
  state: ShoppingListDetailsState;
  dispatch: Dispatch<ShoppingListDetailsAction>;
}

interface ShoppingListDetailsProviderProps {
  children: ReactNode;
}

const initState = {
  id: 0,
  isLoading: false,
};

export const ShoppingListDetailsContext = createContext<ShoppingListDetailsContextType>({
  state: initState,
  dispatch: () => {},
});

const reducer = (state: ShoppingListDetailsState, action: ShoppingListDetailsAction) => {
  switch (action.type) {
    case 'all':
      return {
        ...state,
        ...action.payload,
      };
    case 'init':
      return {
        ...state,
        id: action.payload.id,
      };
    case 'loading':
      return {
        ...state,
        isLoading: action.payload.isLoading,
      };
    default:
      return state;
  }
};

export function ShoppingListDetailsProvider(props: ShoppingListDetailsProviderProps) {
  const [state, dispatch] = useReducer(reducer, initState);

  const { children } = props;

  const ShoppingListDetailsValue = useMemo(
    () => ({
      state,
      dispatch,
    }),
    [state],
  );

  return (
    <ShoppingListDetailsContext.Provider value={ShoppingListDetailsValue}>
      {children}
    </ShoppingListDetailsContext.Provider>
  );
}
