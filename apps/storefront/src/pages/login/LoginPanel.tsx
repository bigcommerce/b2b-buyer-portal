import { Box, useTheme } from '@mui/material'

import { CustomButton } from '@/components'
import { getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles'

import LoginWidget from './component/LoginWidget'
import { LoginInfoInit } from './config'

interface LoginPanelProps {
  loginInfo: Partial<LoginInfoInit>
  handleSubmit?: () => void
}

function LoginPanel(props: LoginPanelProps) {
  const { loginInfo, handleSubmit } = props

  const theme = useTheme()

  const { widgetBodyText = '', CreateAccountButtonText } = loginInfo

  return (
    <Box
      sx={{
        padding: '20px',
        background: '#F5F5F5',
        borderRadius: '4px',
      }}
    >
      <LoginWidget
        sx={{
          minHeight: '250px',
        }}
        isVisible
        html={widgetBodyText}
      />
      <Box
        sx={{
          marginTop: '5px',
        }}
      >
        <CustomButton
          type="submit"
          onClick={handleSubmit}
          variant="contained"
          sx={{
            ml: 1,
            backgroundColor: theme.palette.primary.main,
            color: getContrastColor(theme.palette.primary.main),
          }}
        >
          {CreateAccountButtonText}
        </CustomButton>
      </Box>
    </Box>
  )
}

export default LoginPanel
