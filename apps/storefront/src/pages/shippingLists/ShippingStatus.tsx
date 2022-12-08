import {
  useContext,
} from 'react'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  B3Tag,
} from '@/components/B3Tag'

import {
  getFilterShippingListStatus,
} from './config'

interface NewStatuProps {
  label: string,
  value: string | number,
  color: string,
  textColor: string,
}

export const getStatus = (role: number | string) => {
  const statusArr = getFilterShippingListStatus(role)

  const newStatus: Array<NewStatuProps> = statusArr.map((item) => {
    if (+item.value === 0) {
      return {
        color: '#C4DD6C',
        textColor: item.label,
        ...item,
      }
    }

    if (+item.value === 30) {
      return {
        color: '#F4CC46',
        textColor: item.label,
        ...item,
      }
    }

    if (+item.value === 30) {
      return {
        color: '#899193',
        textColor: item.label,
        ...item,
      }
    }
    return {
      color: '#7A6041',
      textColor: item.label,
      ...item,
    }
  })

  return newStatus
}

interface ShippingStatusProps {
  status: number
}

export const ShippingStatus = ({
  status,
}: ShippingStatusProps) => {
  const {
    state: {
      role,
    },
  } = useContext(GlobaledContext)
  const statusList = getStatus(role)
  const statusItem = statusList.find((item: NewStatuProps) => +item.value === +status)

  if (statusItem) {
    return (
      <B3Tag
        color={statusItem.color}
        textColor={statusItem.textColor}
      >
        {statusItem.label}
      </B3Tag>
    )
  }

  return null
}
