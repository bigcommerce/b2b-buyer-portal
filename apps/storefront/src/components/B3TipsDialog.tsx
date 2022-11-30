import React, {
  Dispatch,
  ReactNode,
  SetStateAction,
} from 'react'

import {
  Box,
  Button,
} from '@mui/material'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'

import styled from '@emotion/styled'

import {
  B3ConfirmDialog,
} from './B3ConfirmDialog'

const TipsContent = styled(Box)({
  padding: '30px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
})

interface B3TipsDialogProps {
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
  onClose?: () => void,
  children: ReactNode,
  type?: 'success' | 'error' | 'warn'
}

const icon = {
  success: (
    <CheckCircleOutlineIcon
      sx={{
        fontSize: '80px',
        color: '#329632',
      }}
    />
  ),
  error: (
    <HighlightOffIcon
      sx={{
        fontSize: '80px',
        color: '#F67474',
      }}
    />
  ),
  warn: (
    <ErrorOutlineIcon
      sx={{
        fontSize: '80px',
        color: '#1976D2',
      }}
    />
  ),
}

export const B3TipsDialog = (props: B3TipsDialogProps) => {
  const {
    isOpen,
    children,
    setIsOpen,
    onClose,
    type = 'success',
  } = props

  const handleClose = () => {
    setIsOpen(false)
    if (onClose) {
      onClose()
    }
  }

  return (
    <B3ConfirmDialog
      showTitle={false}
      isHiddenDivider
      isShowAction={false}
      isOpen={isOpen}
      fullWidth={false}
      maxWidth="xs"
      onClose={handleClose}
    >
      <TipsContent>
        {icon[type]}
        {children}
        <Button
          color="primary"
          variant="contained"
          onClick={handleClose}
        >
          OK
        </Button>
      </TipsContent>
    </B3ConfirmDialog>
  )
}
