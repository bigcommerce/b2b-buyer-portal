import {
  Box,
  Button,
} from '@mui/material'

import {
  useB3Lang,
} from '@b3/lang'

import {
  steps,
} from '../config'

function RegisteredStepButton(props: any) {
  const {
    activeStep,
    handleBack,
    handleNext,
    handleFinish,
  } = props

  const b3Lang = useB3Lang()

  return (
    <Box>
      {activeStep === steps.length ? (
        <Box sx={{
          display: 'flex',
          flexDirection: 'row-reverse',
          pt: 2,
        }}
        >
          <Button
            variant="contained"
            onClick={() => handleFinish()}
          >
            {b3Lang('intl.global.button.finish')}
          </Button>
        </Box>
      ) : (
        <Box sx={{
          display: 'flex',
          flexDirection: 'row-reverse',
          pt: 2,
        }}
        >
          <Button
            variant="contained"
            onClick={handleNext}
          >
            {activeStep === steps.length - 1 ? b3Lang('intl.global.button.submit') : b3Lang('intl.global.button.next')}
          </Button>
          {
            activeStep !== 0 && (
            <Button
              variant="text"
              onClick={handleBack}
              sx={{
                mr: 1,
              }}
            >
              {b3Lang('intl.global.button.back')}
            </Button>
            )
          }
        </Box>
      )}
    </Box>
  )
}

export default RegisteredStepButton
