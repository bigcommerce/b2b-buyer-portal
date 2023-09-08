import { useContext } from 'react'
import { useB3Lang } from '@b3/lang'
import { Alert, Box } from '@mui/material'

import { getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles'
import { useMobile } from '@/hooks'
import { CustomStyleContext } from '@/shared/customStyleButtton'
import { B3SStorage } from '@/utils'

import RegisteredStepButton from './component/RegisteredStepButton'
import { RegisteredContext } from './context/RegisteredContext'
import { StyleTipContainer } from './styled'

export default function RegisteredFinish(props: {
  activeStep: number
  handleFinish: () => void
  isBCToB2B?: boolean
}) {
  const { activeStep, handleFinish, isBCToB2B = false } = props
  const { state } = useContext(RegisteredContext)
  const b3Lang = useB3Lang()

  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext)
  const [isMobile] = useMobile()

  const customColor = getContrastColor(backgroundColor)

  const { accountType, submitSuccess, isAutoApproval, storeName } = state

  const blockPendingAccountOrderCreation =
    B3SStorage.get('blockPendingAccountOrderCreation') && !isAutoApproval

  const renderB2BSuccessPage = () => {
    if (accountType === '1') {
      return isAutoApproval ? (
        <StyleTipContainer>
          {b3Lang('intl.user.register.RegisterFinish.autoApproved.tip', {
            storeName,
          })}
        </StyleTipContainer>
      ) : (
        <>
          {blockPendingAccountOrderCreation && (
            <Alert
              severity="warning"
              variant="filled"
              sx={{
                margin: 'auto',
                borderRadius: '4px',
                padding: '6px 16px',
                maxWidth: '820px',
              }}
            >
              {b3Lang(
                'intl.user.register.RegisterFinish.blockPendingAccountOrderCreation.tip'
              )}
            </Alert>
          )}
          <StyleTipContainer>
            {blockPendingAccountOrderCreation
              ? b3Lang(
                  'intl.user.register.RegisterFinish.notAutoApproved.warningTip'
                )
              : b3Lang('intl.user.register.RegisterFinish.notAutoApproved.tip')}
          </StyleTipContainer>
        </>
      )
    }

    if (accountType === '2') {
      return (
        <StyleTipContainer>
          {b3Lang('intl.user.register.RegisterFinish.bcSuccess.tip', {
            storeName,
          })}
        </StyleTipContainer>
      )
    }
    return undefined
  }

  return (
    <Box
      sx={
        isBCToB2B
          ? {
              pl: 2,
              pr: 2,
              mt: 2,
              '& p': {
                color: customColor,
              },
              width: isMobile ? '100%' : '537px',
              boxShadow:
                '0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px rgba(0, 0, 0, 0.14), 0px 1px 3px rgba(0, 0, 0, 0.12)',
              borderRadius: '4px',
              background: '#FFFFFF',
              padding: '0 0.8rem 1rem 0.8rem',
            }
          : {
              mt: 2,
              '& p': {
                color: customColor,
              },
            }
      }
    >
      {submitSuccess && (
        <>
          {renderB2BSuccessPage()}
          <RegisteredStepButton
            activeStep={activeStep}
            handleFinish={handleFinish}
          />
        </>
      )}
    </Box>
  )
}
