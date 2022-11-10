import {
  useReducer,
  createContext,
  Dispatch,
  ReactNode,
  useMemo,
} from 'react'

interface OrderDetailsState {
  shippings?: any,
  history?: any,
  poNumber?: string,
  status?: string,
  statusCode?: string,
  currencyCode?: string,
  currency?: string,
  orderSummary?: any,
  customStatus?: string,
  money?: any,
  payment?: any,
  orderComments?: string,
  products?: any,
  orderId?: number | string,
  orderStatus?: any,
}
interface OrderDetailsAction {
  type: string,
  payload: OrderDetailsState
}
export interface OrderDetailsContextType {
  state: OrderDetailsState,
  dispatch: Dispatch<OrderDetailsAction>,
}

interface OrderDetailsProviderProps {
  children: ReactNode
}

const initState = {
  shippings: [],
  history: [],
  poNumber: '',
  status: '',
  statusCode: '',
  currencyCode: '',
  currency: '',
  orderSummary: {},
  customStatus: '',
  money: {},
  payment: {},
  orderComments: '',
  products: [],
  orderId: '',
  orderStatus: [],
}

export const OrderDetailsContext = createContext<OrderDetailsContextType>({
  state: initState,
  dispatch: () => {},
})

const reducer = (state: OrderDetailsState, action: OrderDetailsAction) => {
  switch (action.type) {
    case 'all':
      return {
        ...state,
        ...action.payload,
      }
    case 'statusType':
      return {
        ...state,
        orderStatus: action.payload.orderStatus,
      }
    default:
      return state
  }
}

export function OrderDetailsProvider(props: OrderDetailsProviderProps) {
  const [state, dispatch] = useReducer(reducer, initState)

  const {
    children,
  } = props

  const OrderDetailsValue = useMemo(() => ({
    state,
    dispatch,
  }), [state])

  return (
    <OrderDetailsContext.Provider value={OrderDetailsValue}>
      {children}
    </OrderDetailsContext.Provider>
  )
}
