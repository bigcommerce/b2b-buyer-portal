import { useContext } from 'react'
import { useB3Lang } from '@b3/lang'
import { Box } from '@mui/material'

import RegisteredStepButton from './component/RegisteredStepButton'
import { RegisteredContext } from './context/RegisteredContext'
import { StyleTipContainer } from './styled'

export default function RegisteredFinish(props: {
  activeStep: number
  handleFinish: () => void
}) {
  const { activeStep, handleFinish } = props
  const { state } = useContext(RegisteredContext)
  const b3Lang = useB3Lang()

  const { accountType, submitSuccess, isAutoApproval, storeName } = state

  const renderB2BSuccessPage = () => {
    if (accountType === '1') {
      return isAutoApproval ? (
        <StyleTipContainer>
          {b3Lang('intl.user.register.RegisterFinish.autoApproved.tip', {
            storeName,
          })}
        </StyleTipContainer>
      ) : (
        <StyleTipContainer>
          {b3Lang('intl.user.register.RegisterFinish.notAutoApproved.tip')}
        </StyleTipContainer>
      )
    }

    if (accountType === '2') {
      return (
        <StyleTipContainer>
          {b3Lang('intl.user.register.RegisterFinish.bcSuccess.tip', {
            storeName,
          })}
        </StyleTipContainer>
      )
    }
    return undefined
  }

  return (
    <Box
      sx={{
        pl: 10,
        pr: 10,
        mt: 2,
      }}
    >
      {submitSuccess && (
        <>
          {renderB2BSuccessPage()}
          <RegisteredStepButton
            activeStep={activeStep}
            handleFinish={handleFinish}
          />
        </>
      )}
    </Box>
  )
}
