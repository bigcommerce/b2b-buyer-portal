import { useContext } from 'react'

import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
} from '@mui/material'

import { RegisteredContext } from './context/RegisteredContext'
import { steps } from './config'

export default function RegisteredStep(props: any) {
  const {
    children,
    isStepOptional,
    activeStep,
  } = props

  const { state } = useContext(RegisteredContext)
  const { accountType, submitSuccess } = state
  const newPageTitle = accountType === '1' ? 'Registration Complete. Thank You!' : 'Your personal account has been created.'

  return (
    <Box component="div">
      <Box
        component="h3"
        sx={{
          display: 'flex', flexDirection: 'row', justifyContent: 'center', pt: 2,
        }}
      >
        {
          submitSuccess ? newPageTitle : 'Account Registration'
        }
      </Box>
      {
        !submitSuccess && (
        <Stepper activeStep={activeStep}>
          {steps.map((label, index) => {
            const stepProps = {}
            const labelProps: any = {}
            if (isStepOptional(index)) {
              labelProps.optional = (
                <Typography variant="caption">Optional</Typography>
              )
            }
            return (
              <Step
                key={label}
                {...stepProps}
              >
                <StepLabel {...labelProps}>{label}</StepLabel>
              </Step>
            )
          })}
        </Stepper>
        )
      }

      {children}
    </Box>
  )
}
