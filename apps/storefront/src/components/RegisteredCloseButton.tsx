import { Dispatch, SetStateAction, useContext } from 'react'
import globalB3 from '@b3/global-b3'
import type { OpenPageState } from '@b3/hooks'
import { Box } from '@mui/material'

import { GlobaledContext } from '@/shared/global'

import { CloseButton } from './styled'

interface CloseButtonProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
}

export default function RegisteredCloseButton(props: CloseButtonProps) {
  const { setOpenPage } = props

  const {
    state: { isCheckout, isCloseGotoBCHome },
  } = useContext(GlobaledContext)

  const handleCloseForm = () => {
    if (
      isCloseGotoBCHome ||
      (isCheckout && document.getElementById(globalB3['dom.openB3Checkout']))
    ) {
      window.location.href = '/'
    } else {
      setOpenPage({
        isOpen: false,
        openUrl: '',
      })
    }
    window.history.replaceState(null, '', window.location.pathname || '/')
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row-reverse',
        pr: 2,
      }}
    >
      <CloseButton onClick={handleCloseForm} />
    </Box>
  )
}
