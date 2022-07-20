import { useContext } from 'react'

import { Box } from '@mui/material'

import { RegisteredContext } from './context/RegisteredContext'
import RegisteredStepButton from './component/RegisteredStepButton'

import { StyleTipContainer } from './styled'

export default function RegisteredFinish(props: { activeStep: any; handleFinish: () => void}) {
  const { activeStep, handleFinish } = props
  const { state } = useContext(RegisteredContext)

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
            {`Thank you for creating your account at ${storeName}. Your company account application has been approved`}
          </StyleTipContainer>
        ) : (
          <StyleTipContainer>
            Your company account application has been received. Please allow 24 hours for account approval and activation.
          </StyleTipContainer>
        )
      )
    }

    if (accountType === '2') {
      return (
        <StyleTipContainer>
          {`Thank you for creating your account at ${storeName}.`}
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
