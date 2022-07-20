import { useContext } from 'react'

import {
  Box,
  Button,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'

import { RegisteredContext } from './context/RegisteredContext'

import { StyleTipContainer } from './styled'

export default function RegisteredFinish() {
  const { state, dispatch } = useContext(RegisteredContext)
  const navigate = useNavigate()
  const {
    accountType,
    submitSuccess,
    isAutoApproval,
    storeName,
  } = state

  const renderB2BSuccessPage = () => {
    if (accountType === '1') {
      return (
        isAutoApproval ? (
          <StyleTipContainer>
            {`Thank you for creating your account at ${storeName}. Your company account application has been approved`}
          </StyleTipContainer>
        ) : (
          <StyleTipContainer>
            Your company account application has been received. Please allow 24 hours for account approval and activation.
          </StyleTipContainer>
        )
      )
    }

    if (accountType === '2') {
      return (
        <StyleTipContainer>
          {`Thank you for creating your account at ${storeName}.`}
        </StyleTipContainer>
      )
    }
  }

  const handleFinish = () => {
    const isHasFrontPage = window?.history?.length > 2
    if (dispatch) {
      dispatch({
        type: 'finishInfo',
        payload: {
          submitSuccess: false,
        },
      })
    }

    if (isHasFrontPage) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  return (
    <Box
      sx={{
        pl: 10,
        pr: 10,
        mt: 2,
      }}
    >
      {
        submitSuccess && (
          <>
            { renderB2BSuccessPage() }
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleFinish}
                sx={{ mt: 3, ml: 1 }}
              >
                FINISH
              </Button>
            </Box>
          </>
        )
      }
    </Box>
  )
}
