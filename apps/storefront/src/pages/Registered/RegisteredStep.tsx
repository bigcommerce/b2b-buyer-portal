import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
} from '@mui/material'

import { steps } from './config'

export default function RegisteredStep(props: any) {
  const {
    children,
    // isStepSkipped,
    isStepOptional,
    activeStep,
  } = props

  return (
    <Box component="div">
      <Box
        component="h3"
        sx={{
          display: 'flex', flexDirection: 'row', justifyContent: 'center', pt: 2,
        }}
      >
        Account Registration
      </Box>
      <Stepper activeStep={activeStep}>
        {steps.map((label, index) => {
          const stepProps = {}
          const labelProps: any = {}
          if (isStepOptional(index)) {
            labelProps.optional = (
              <Typography variant="caption">Optional</Typography>
            )
          }
          // if (isStepSkipped(index)) {
          //   stepProps.completed = false
          // }
          return (
            <Step key={label} {...stepProps}>
              <StepLabel {...labelProps}>{label}</StepLabel>
            </Step>
          )
        })}
      </Stepper>
      {children}
    </Box>
  )
}
