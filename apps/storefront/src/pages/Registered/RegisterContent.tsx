import React, { ReactNode, ChangeEvent } from 'react'
import {
  Box,
} from '@mui/material'

import RegisteredAccount from './RegisteredAccount'
import RegisteredDetail from './RegisteredDetail'
import RegisteredFinish from './RegisteredFinish'
import RegisterComplete from './RegisterComplete'

interface RegisterContentProps {
  activeStep: number,
  handleReset: () => void,
  handleBack:() => void,
  handleNext: () => void,
}

export default function RegisterContent(props: RegisterContentProps) {
  const {
    activeStep, handleReset, handleBack, handleNext,
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
          <RegisteredFinish />
        )

      case 3:
        return (
          <RegisterComplete />
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
