import { Dispatch, SetStateAction, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box } from '@mui/material'

import { GlobaledContext } from '@/shared/global'
import { OpenPageState } from '@/types/hooks'

import { CloseButton } from './styled'

interface CloseButtonProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
}

export default function RegisteredCloseButton(props: CloseButtonProps) {
  const { setOpenPage } = props

  const {
    state: { isCloseGotoBCHome },
  } = useContext(GlobaledContext)
  const navigate = useNavigate()

  const handleCloseForm = () => {
    if (isCloseGotoBCHome) {
      window.location.href = '/'
    } else {
      navigate('/')
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
