import {
  ReactNode,
} from 'react'

import {
  B3Tag,
} from '@/components/B3Tag'

import getOrderStatus from '../shared/getOrderStatus'

interface OrderStatusProps {
  code: string,
}

export const OrderStatus = (props: OrderStatusProps) => {
  const {
    code,
  } = props

  const status = getOrderStatus(code)

  return (
    status.name ? (
      <B3Tag
        color={status.color}
        textColor={status.textColor}
      >
        {status.name}
      </B3Tag>
    ) : <></>
  )
}
