import {
  Box,
  Button,
} from '@mui/material'

import { steps } from '../config'

function RegisteredStepButton(props: any) {
  const {
    activeStep, handleBack, handleNext, handleFinish,
  } = props

  return (
    <Box>
      {activeStep === steps.length ? (
        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
          <Box sx={{ flex: '1 1 auto' }} />
          <Button onClick={() => handleFinish()}>Finish</Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
          {
            activeStep !== 0 && (
            <Button
              color="inherit"
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
            )
          }
          <Box sx={{ flex: '1 1 auto' }} />
          <Button onClick={handleNext}>
            {activeStep === steps.length - 1 ? 'Submit' : 'Next'}
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default RegisteredStepButton
