import { useContext } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import useMobile from '@/hooks/useMobile'
import { GlobaledContext } from '@/shared/global'
import { globalStateSelector } from '@/store'

import { CloseBox, CloseBoxMobile, CloseButton } from '../styled'

export default function B3CloseAppButton() {
  const [isMobile] = useMobile()

  const { setOpenPageFn } = useSelector(globalStateSelector)

  const {
    state: { isCloseGotoBCHome },
  } = useContext(GlobaledContext)
  const navigate = useNavigate()

  const handleCloseForm = () => {
    if (isCloseGotoBCHome) {
      window.location.href = '/'
    } else {
      navigate('/')
      setOpenPageFn({
        isOpen: false,
        openUrl: '',
      })
    }
    window.history.replaceState(null, '', window.location.pathname || '/')
  }

  const Box = isMobile ? CloseBoxMobile : CloseBox

  return (
    <Box>
      <CloseButton
        sx={{
          color: '#757371',
        }}
        onClick={handleCloseForm}
      />
    </Box>
  )
}
