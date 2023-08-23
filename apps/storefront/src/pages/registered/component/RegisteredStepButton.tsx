import { useB3Lang } from '@b3/lang'
import { Box, useTheme } from '@mui/material'

import { CustomButton } from '@/components'

import { steps } from '../config'

function RegisteredStepButton(props: any) {
  const { activeStep, handleBack, handleNext, handleFinish } = props

  const b3Lang = useB3Lang()
  const theme = useTheme()

  return (
    <Box>
      {activeStep === steps.length ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row-reverse',
            pt: 2,
          }}
        >
          <CustomButton variant="contained" onClick={() => handleFinish()}>
            {b3Lang('global.button.finish')}
          </CustomButton>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row-reverse',
            pt: 2,
          }}
        >
          <CustomButton
            variant="contained"
            onClick={handleNext}
            sx={{
              backgroundColor: theme.palette.primary.main,
            }}
          >
            {activeStep === steps.length - 1
              ? b3Lang('global.button.submit')
              : b3Lang('global.button.next')}
          </CustomButton>
          {activeStep !== 0 && (
            <CustomButton
              variant="contained"
              onClick={handleBack}
              sx={{
                backgroundColor: theme.palette.primary.main,
                mr: 1,
              }}
            >
              {b3Lang('global.button.back')}
            </CustomButton>
          )}
        </Box>
      )}
    </Box>
  )
}

export default RegisteredStepButton
