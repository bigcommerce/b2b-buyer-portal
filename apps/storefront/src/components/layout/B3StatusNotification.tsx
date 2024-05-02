import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { Alert, Box } from '@mui/material'

import { StatusNotifications } from '@/constants'
import { useBlockPendingAccountViewPrice } from '@/hooks'
import { useAppDispatch, useAppSelector } from '@/store'
import { setLoginType } from '@/store/slices/company'
import { LoginTypes } from '@/types'
import { B3SStorage } from '@/utils'

export type AlertColor = 'success' | 'info' | 'warning' | 'error'

interface B3StatusNotificationProps {
  title: string
}

const B3StatusNotificationContainer = styled(Box)(() => ({
  '& svg': {
    color: '#FFFFFF',
  },
}))

export default function B3StatusNotification(props: B3StatusNotificationProps) {
  const { title } = props

  const loginType = useAppSelector(({ company }) => company.customer.loginType)
  const dispatch = useAppDispatch()
  const role = useAppSelector(({ company }) => company.customer.role)
  const companyStatus = useAppSelector(
    ({ company }) => company.companyInfo.status
  )
  const blockPendingAccountOrderCreation = B3SStorage.get(
    'blockPendingAccountOrderCreation'
  )
  const [blockPendingAccountViewPrice] = useBlockPendingAccountViewPrice()
  const [tip, setTip] = useState<string>('')
  const [isShow, setIsShow] = useState<boolean>(false)
  const [type, setType] = useState<AlertColor>('success')
  const [bcColor, setBcColor] = useState<string>('#2E7D32')

  const handleCloseTip = () => {
    dispatch(setLoginType(LoginTypes.WAITING_LOGIN))
    setIsShow(false)
  }

  const action: CustomFieldItems = {}
  if (+companyStatus !== 0) {
    action.onClose = handleCloseTip
  }

  useEffect(() => {
    const loginTypeStatus = +companyStatus === 0 ? true : loginType === 1

    const showTip = role === 100 ? false : loginTypeStatus
    setIsShow(showTip)
    if (showTip) {
      if (+companyStatus === 0) {
        if (blockPendingAccountOrderCreation && blockPendingAccountViewPrice) {
          setTip(StatusNotifications.pendingOrderingAndViewPriceBlocked)
        }

        if (blockPendingAccountOrderCreation && !blockPendingAccountViewPrice) {
          setTip(StatusNotifications.pendingOrderingBlocked)
        }

        if (!blockPendingAccountOrderCreation && blockPendingAccountViewPrice) {
          setTip(StatusNotifications.pendingViewPriceBlocked)
        }

        if (
          !blockPendingAccountOrderCreation &&
          !blockPendingAccountViewPrice
        ) {
          setTip(StatusNotifications.pendingOrderingNotBlocked)
        }
        setType('info')
        setBcColor('#0288D1')
      }

      if (+companyStatus === 1) {
        setTip(StatusNotifications.approvedTip)
        setType('success')
        setBcColor('#2E7D32')
      }

      if (+companyStatus === 2) {
        setTip(StatusNotifications.rejectedTip)
        setType('warning')
        setBcColor('#ED6C02')
      }
    }
  }, [
    blockPendingAccountOrderCreation,
    blockPendingAccountViewPrice,
    companyStatus,
    loginType,
    role,
  ])

  return isShow ? (
    <B3StatusNotificationContainer
      sx={{
        mb: title ? '20px' : '0',
      }}
    >
      <Alert
        {...action}
        severity={type || 'success'}
        sx={{
          color: '#FFFFFF',
          backgroundColor: bcColor,
        }}
      >
        {tip}
      </Alert>
    </B3StatusNotificationContainer>
  ) : null
}
