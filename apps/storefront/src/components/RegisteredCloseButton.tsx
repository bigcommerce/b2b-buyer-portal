import type {
  OpenPageState,
} from '@b3/hooks'

import {
  Dispatch,
  SetStateAction,
} from 'react'

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
    setOpenPage({
      isOpen: false,
    })
  }

  return (
    <CloseButton
      onClick={handleCloseForm}
    />
  )
}
