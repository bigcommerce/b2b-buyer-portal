import {
  ReactNode,
} from 'react'
import {
  Box,
} from '@mui/material'

import RegisteredAccount from './RegisteredAccount'
import RegisteredDetail from './RegisteredDetail'
import RegisteredFinish from './RegisteredFinish'
import RegisterComplete from './RegisterComplete'

interface RegisterContentProps {
  activeStep: number,
  handleBack:() => void,
  handleNext: () => void,
  handleFinish: () => void,
}

export default function RegisterContent(props: RegisterContentProps) {
  const {
    activeStep,
    handleBack,
    handleNext,
    handleFinish,
  } = props

  const renderStep = (step: number): ReactNode => {
    switch (step) {
      case 0:
        return (
          <RegisteredAccount
            activeStep={activeStep}
            handleBack={handleBack}
            handleNext={handleNext}
          />
        )

      case 1:
        return (
          <RegisteredDetail
            activeStep={activeStep}
            handleBack={handleBack}
            handleNext={handleNext}
          />
        )

      case 2:
        return (
          <RegisterComplete
            activeStep={activeStep}
            handleBack={handleBack}
            handleNext={handleNext}
          />
        )

      case 3:
        return (
          <RegisteredFinish
            activeStep={activeStep}
            handleFinish={handleFinish}
          />
        )

      default:
        return null
    }
  }
  return (
    <Box component="div">
      {renderStep(activeStep)}
    </Box>
  )
}
