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

  const handleCloseForm = () => {
    setIsOpen(false)
  }

  return (
    <Close onClick={handleCloseForm} />
  )
}
