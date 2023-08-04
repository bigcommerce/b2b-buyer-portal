import { createContext, Dispatch, ReactNode, useMemo, useReducer } from 'react'

import {
  OrderBillings,
  OrderCurrency,
  OrderHistoryItem,
  OrderPayment,
  OrderProductItem,
  OrderShippingsItem,
  OrderStatusItem,
  OrderSummary,
} from '../../../types'

export interface OrderDetailsState {
  shippings?: OrderShippingsItem[]
  billings?: OrderBillings[]
  history?: OrderHistoryItem[]
  poNumber?: string
  status?: string
  statusCode?: string | number
  currencyCode?: string
  currency?: string
  orderSummary?: OrderSummary
  customStatus?: string
  money?: OrderCurrency
  payment?: OrderPayment
  orderComments?: string
  products?: OrderProductItem[]
  orderId?: number | string
  orderStatus?: OrderStatusItem[]
  ipStatus?: number
  invoiceId?: number
  addressLabelPermission?: boolean
  canReturn?: boolean
  createdEmail?: string
  orderIsDigital?: boolean
}
interface OrderDetailsAction {
  type: string
  payload: OrderDetailsState
}
export interface OrderDetailsContextType {
  state: OrderDetailsState
  dispatch: Dispatch<OrderDetailsAction>
}

interface OrderDetailsProviderProps {
  children: ReactNode
}

const initState = {
  shippings: [],
  billings: [],
  history: [],
  poNumber: '',
  status: '',
  statusCode: '',
  currencyCode: '',
  currency: '',
  orderSummary: {
    createAt: '',
    name: '',
    priceData: {},
  },
  customStatus: '',
  money: {},
  payment: {},
  orderComments: '',
  products: [],
  orderId: '',
  orderStatus: [],
  ipStatus: 0,
  invoiceId: 0,
  addressLabelPermission: false,
  canReturn: false,
  createdEmail: '',
  orderIsDigital: false,
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
    case 'addressLabel':
      return {
        ...state,
        addressLabelPermission: action.payload.addressLabelPermission,
      }
    default:
      return state
  }
}

export function OrderDetailsProvider(props: OrderDetailsProviderProps) {
  const [state, dispatch] = useReducer(reducer, initState)

  const { children } = props

  const OrderDetailsValue = useMemo(
    () => ({
      state,
      dispatch,
    }),
    [state]
  )

  return (
    <OrderDetailsContext.Provider value={OrderDetailsValue}>
      {children}
    </OrderDetailsContext.Provider>
  )
}
