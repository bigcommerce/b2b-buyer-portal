import {
  useContext,
  ReactNode,
} from 'react'

import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
} from '@mui/material'

import {
  useB3Lang,
} from '@b3/lang'

import {
  RegisteredContext,
} from './context/RegisteredContext'
import {
  steps,
} from './config'

interface RegisteredStepProps {
  children: ReactNode,
  isStepOptional: (index: number) => Boolean,
  activeStep: number
}

export default function RegisteredStep(props: RegisteredStepProps) {
  const {
    children,
    isStepOptional,
    activeStep,
  } = props

  const b3Lang = useB3Lang()

  const {
    state,
  } = useContext(RegisteredContext)
  const {
    accountType,
    submitSuccess,
  } = state
  const newPageTitle = accountType === '1' ? b3Lang('intl.user.register.title.registerComplete') : b3Lang('intl.user.register.title.accountCreated')

  return (
    <Box component="div">
      <Box
        component="h3"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          pt: 2,
        }}
      >
        {
          submitSuccess ? newPageTitle : b3Lang('intl.user.register.title.accountRegister')
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
                <Typography variant="caption">{b3Lang('intl.user.register.step.optional')}</Typography>
              )
            }
            return (
              <Step
                key={label}
                {...stepProps}
              >
                <StepLabel {...labelProps}>{b3Lang(label)}</StepLabel>
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
