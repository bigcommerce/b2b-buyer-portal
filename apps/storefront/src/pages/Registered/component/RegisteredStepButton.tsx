import { MouseEvent } from 'react'

import {
  Box,
  Button,
} from '@mui/material'

import { steps } from '../config'

interface RegisteredStepButtonProps {
  handleBack?: () => void
  handleNext: (event: MouseEvent) => void
  activeStep: number
  handleReset?: () => void,
}

function RegisteredStepButton(props: RegisteredStepButtonProps) {
  const {
    activeStep, handleReset, handleBack, handleNext,
  } = props

  return (
    <Box>
      {activeStep === steps.length ? (
        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
          <Box sx={{ flex: '1 1 auto' }} />
          <Button onClick={handleReset}>Reset</Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
          <Button
            color="inherit"
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Box sx={{ flex: '1 1 auto' }} />
          <Button onClick={handleNext}>
            {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default RegisteredStepButton
