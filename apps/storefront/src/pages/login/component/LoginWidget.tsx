import { Box } from '@mui/material'

interface StyleWidget {
  [key: string]: string
}

interface LoginWidgetProps {
  isVisible: boolean
  sx: StyleWidget
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
