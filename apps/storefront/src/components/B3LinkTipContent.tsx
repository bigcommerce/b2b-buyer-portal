import { useNavigate } from 'react-router-dom'
import { Box } from '@mui/material'

export interface B3SuccessTipContentProps {
  message: string
  link?: string
  linkText?: string
  isOutLink?: boolean
}

export function B3LinkTipContent({
  message,
  link = '',
  linkText = 'View',
  isOutLink = false,
}: B3SuccessTipContentProps) {
  const navigate = useNavigate()

  const handleLink = () => {
    if (isOutLink) {
      window.location.href = link
    } else {
      navigate(link)
    }
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'inline',
          marginRight: link ? '20px' : '0',
        }}
      >
        {message}
      </Box>
      {link && (
        <Box
          onClick={handleLink}
          sx={{
            color: 'inherit',
            display: 'inline',
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          {linkText}
        </Box>
      )}
    </Box>
  )
}

export const successTip = ({
  message,
  link = '',
  linkText = 'View',
  isOutLink = false,
}: B3SuccessTipContentProps) =>
  function componentTip() {
    return (
      <B3LinkTipContent
        message={message}
        link={link}
        linkText={linkText}
        isOutLink={isOutLink}
      />
    )
  }
