import type {
  OpenPageState,
} from '@b3/hooks'

import {
  Dispatch,
  SetStateAction,
} from 'react'

import {
  Box,
} from '@mui/material'
import {
  B3SStorage,
} from '@/utils'

import {
  CloseButton,
} from './styled'

interface CloseButtonProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>,
}

export function RegisteredCloseButton(props: CloseButtonProps) {
  const {
    setOpenPage,
  } = props

  const handleCloseForm = () => {
    const isGotoBCHome = B3SStorage.get('isGotoBCHome') || ''
    if (isGotoBCHome) {
      window.location.href = '/'
    } else {
      setOpenPage({
        isOpen: false,
        openUrl: '',
      })
    }
  }

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'row-reverse',
      pr: 2,
    }}
    >
      <CloseButton
        onClick={handleCloseForm}
      />
    </Box>

  )
}
