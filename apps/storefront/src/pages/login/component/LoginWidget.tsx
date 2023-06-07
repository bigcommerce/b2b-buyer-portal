import { Box, SxProps } from '@mui/material'

interface LoginWidgetProps {
  isVisible: boolean
  sx: SxProps
  html: string
}

function LoginWidget(props: LoginWidgetProps) {
  const { isVisible, html, sx } = props

  return isVisible ? (
    <Box
      sx={{
        ...sx,
      }}
      dangerouslySetInnerHTML={{
        __html: html,
      }}
    />
  ) : null
}

export default LoginWidget
