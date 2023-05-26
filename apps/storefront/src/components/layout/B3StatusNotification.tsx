import { useContext, useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { Alert, Box } from '@mui/material'

import { StatusNotifications } from '@/constants'
import { GlobaledContext } from '@/shared/global'
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

  const {
    state: { companyInfo, role },
  } = useContext(GlobaledContext)
  // companyStatus
  // 99: default, Distinguish between bc and b2b; 0: pending; 1: approved; 2: rejected; 3: inactive; 4: deleted
  const { companyStatus } = companyInfo
  const blockPendingAccountOrderCreation = B3SStorage.get(
    'blockPendingAccountOrderCreation'
  )
  const loginType = JSON.parse(sessionStorage.getItem('loginType') || 'false')

  const [tip, setTip] = useState<string>('')
  const [isShow, setIsShow] = useState<boolean>(false)
  const [type, setType] = useState<AlertColor>('success')
  const [bcColor, setBcColor] = useState<string>('#2E7D32')

  const handleCloseTip = () => {
    sessionStorage.setItem('loginType', JSON.stringify(null))
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
        setTip(
          blockPendingAccountOrderCreation
            ? StatusNotifications.pendingOrderingBlocked
            : StatusNotifications.pendingOrderingNotBlocked
        )
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
  }, [])

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
