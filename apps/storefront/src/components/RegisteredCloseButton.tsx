import { useNavigate } from 'react-router-dom'
import { Close } from '@mui/icons-material'

export function RegisteredCloseButton() {
  const navigate = useNavigate()

  const handleCloseForm = () => {
    const isHasFrontPage = window?.history?.length > 2

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
