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

import { getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles'
import { useMobile } from '@/hooks'
import { B3SStorage } from '@/utils'

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
  const [isMobile] = useMobile()
  const theme = useTheme()

  const { state } = useContext(RegisteredContext)
  const { accountType, submitSuccess, isAutoApproval } = state
  const blockPendingAccountOrderCreation =
    B3SStorage.get('blockPendingAccountOrderCreation') && !isAutoApproval
  const registerCompleteText = blockPendingAccountOrderCreation
    ? b3Lang('intl.user.register.title.registerComplete.warning')
    : b3Lang('intl.user.register.title.registerComplete')

  const newPageTitle =
    accountType === '1'
      ? registerCompleteText
      : b3Lang('intl.user.register.title.accountCreated')

  const customColor = getContrastColor(backgroundColor)
  return (
    <Box
      component="div"
      sx={{
        width: isMobile ? '100%' : '537px',
        boxShadow:
          '0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px rgba(0, 0, 0, 0.14), 0px 1px 3px rgba(0, 0, 0, 0.12)',
        borderRadius: '4px',
        marginTop: '1rem',
        background: '#FFFFFF',
        padding: '0 0.8rem 1rem 0.8rem',
      }}
    >
      <Box
        component="h3"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          pt: 2,
          fontSize: '24px',
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
