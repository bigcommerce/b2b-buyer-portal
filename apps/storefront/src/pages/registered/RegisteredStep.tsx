import { ReactNode, useContext } from 'react'
import { useB3Lang } from '@b3/lang'
import {
  Box,
  Step,
  StepLabel,
  Stepper,
  Typography,
  useTheme,
} from '@mui/material'

import {
  b3HexToRgb,
  getContrastColor,
} from '@/components/outSideComponents/utils/b3CustomStyles'

import { RegisteredContext } from './context/RegisteredContext'
import { steps } from './config'

interface RegisteredStepProps {
  children: ReactNode
  isStepOptional: (index: number) => boolean
  activeStep: number
  backgroundColor: string
}

export default function RegisteredStep(props: RegisteredStepProps) {
  const { children, isStepOptional, activeStep, backgroundColor } = props

  const b3Lang = useB3Lang()
  const theme = useTheme()

  const { state } = useContext(RegisteredContext)
  const { accountType, submitSuccess } = state
  const newPageTitle =
    accountType === '1'
      ? b3Lang('intl.user.register.title.registerComplete')
      : b3Lang('intl.user.register.title.accountCreated')

  const customColor = getContrastColor(backgroundColor)
  return (
    <Box component="div">
      <Box
        component="h3"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          pt: 2,
          fontSize: '34px',
          fontWeight: '400',
          margin: '0.5rem 0',
          color: customColor,
        }}
      >
        {submitSuccess
          ? newPageTitle
          : b3Lang('intl.user.register.title.accountRegister')}
      </Box>
      {!submitSuccess && (
        <Stepper
          activeStep={activeStep}
          sx={{
            '& .MuiSvgIcon-root:not(.Mui-active), & .MuiStepLabel-label, & .MuiStepLabel-label.Mui-active, & .MuiStepLabel-label.Mui-completed':
              {
                color: b3HexToRgb(customColor, 0.87),
              },
            '& .MuiSvgIcon-root:not(.Mui-active) .MuiStepIcon-text': {
              fill: getContrastColor(customColor),
            },
            '& .MuiSvgIcon-root.Mui-active .MuiStepIcon-text': {
              fill: getContrastColor(theme.palette.primary.main),
            },
          }}
        >
          {steps.map((label, index) => {
            const stepProps = {}
            const labelProps: any = {}
            if (isStepOptional(index)) {
              labelProps.optional = (
                <Typography variant="caption">
                  {b3Lang('intl.user.register.step.optional')}
                </Typography>
              )
            }
            return (
              <Step key={label} {...stepProps}>
                <StepLabel {...labelProps}>{b3Lang(label)}</StepLabel>
              </Step>
            )
          })}
        </Stepper>
      )}

      {children}
    </Box>
  )
}
