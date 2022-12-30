import {
  Link,
  Box,
} from '@mui/material'

interface B3SuccessTipContentProps{
  message: string,
  link?: string,
  linkText?: string,
}

export const B3LinkTipContent = ({
  message,
  link,
  linkText = 'View',
}: B3SuccessTipContentProps) => (
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
      <Link
        href={link}
        sx={{
          color: 'inherit',
          textDecoration: 'none',
        }}
      >
        {linkText}
      </Link>
    )}
  </Box>
)
