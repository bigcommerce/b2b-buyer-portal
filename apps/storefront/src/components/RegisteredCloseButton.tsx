import {
  useNavigate,
} from 'react-router-dom'
import {
  Close,
} from '@mui/icons-material'

export function RegisteredCloseButton(props: any) {
  const {
    setIsOpen,
  } = props
  const navigate = useNavigate()

  const handleCloseForm = () => {
    const isHasFrontPage = window?.history?.length > 2
    setIsOpen(false)
    if (isHasFrontPage) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  return (
    <Close onClick={handleCloseForm} />
  )
}
