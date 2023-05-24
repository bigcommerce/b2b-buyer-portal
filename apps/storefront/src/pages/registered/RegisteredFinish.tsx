import { useContext } from 'react'
import { useB3Lang } from '@b3/lang'
import { Alert, Box } from '@mui/material'

import { getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles'
import { CustomStyleContext } from '@/shared/customStyleButtton'
import { GlobaledContext } from '@/shared/global'

import RegisteredStepButton from './component/RegisteredStepButton'
import { RegisteredContext } from './context/RegisteredContext'
import { StyleTipContainer } from './styled'

export default function RegisteredFinish(props: {
  activeStep: number
  handleFinish: () => void
}) {
  const { activeStep, handleFinish } = props
  const { state } = useContext(RegisteredContext)
  const b3Lang = useB3Lang()
  const {
    state: { blockPendingAccountOrderCreation },
  } = useContext(GlobaledContext)

  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext)

  const customColor = getContrastColor(backgroundColor)

  const { accountType, submitSuccess, isAutoApproval, storeName } = state

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
          <StyleTipContainer>
            {b3Lang('intl.user.register.RegisterFinish.notAutoApproved.tip')}
          </StyleTipContainer>
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
      sx={{
        pl: 10,
        pr: 10,
        mt: 2,
        '& p': {
          color: customColor,
        },
      }}
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
