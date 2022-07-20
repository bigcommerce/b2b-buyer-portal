import { useContext } from 'react'

import { Box } from '@mui/material'

import { useB3Lang } from '@b3/lang'

import { RegisteredContext } from './context/RegisteredContext'
import RegisteredStepButton from './component/RegisteredStepButton'

import { StyleTipContainer } from './styled'

export default function RegisteredFinish(props: { activeStep: any; handleFinish: () => void}) {
  const { activeStep, handleFinish } = props
  const { state } = useContext(RegisteredContext)
  const b3Lang = useB3Lang()

  const {
    accountType,
    submitSuccess,
    isAutoApproval,
    storeName,
  } = state

  const renderB2BSuccessPage = () => {
    if (accountType === '1') {
      return (
        isAutoApproval ? (
          <StyleTipContainer>
            {b3Lang('intl.user.register.RegisterFinish.autoApproved.tip', { storeName })}
          </StyleTipContainer>
        ) : (
          <StyleTipContainer>
            {b3Lang('intl.user.register.RegisterFinish.notAutoApproved.tip')}
          </StyleTipContainer>
        )
      )
    }

    if (accountType === '2') {
      return (
        <StyleTipContainer>
          {b3Lang('intl.user.register.RegisterFinish.bcSuccess.tip', { storeName })}
        </StyleTipContainer>
      )
    }
  }

  return (
    <Box
      sx={{
        pl: 10,
        pr: 10,
        mt: 2,
      }}
    >
      {
        submitSuccess && (
          <>
            { renderB2BSuccessPage() }
            <RegisteredStepButton
              activeStep={activeStep}
              handleFinish={handleFinish}
            />
          </>
        )
      }
    </Box>
  )
}
