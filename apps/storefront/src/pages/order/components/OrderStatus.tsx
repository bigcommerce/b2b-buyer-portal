import {
  ReactNode,
} from 'react'

import {
  B3Tag,
} from '@/components/B3Tag'

import getOrderStatus from '../shared/getOrderStatus'

interface OrderStatusProps {
  code: string,
  text?: string,
}

export const OrderStatus = (props: OrderStatusProps) => {
  const {
    code,
    text,
  } = props

  const status = getOrderStatus(code)

  return (
    status.name ? (
      <B3Tag
        color={status.color}
        textColor={status.textColor}
      >
        {text || status.name}
      </B3Tag>
    ) : <></>
  )
}
