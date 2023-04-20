import {
  Box,
  useTheme,
} from '@mui/material'

import LoginWidget from './component/LoginWidget'

import {
  LoginInfoInit,
} from './config'

import {
  CustomButton,
} from '@/components'

import {
  getContrastColor,
} from '@/components/outSideComponents/utils/b3CustomStyles'

interface LoginPanelProps {
  loginInfo: Partial<LoginInfoInit>;
  handleSubmit?: () => void;
}

const LoginPanel = (props: LoginPanelProps) => {
  const {
    loginInfo,
    handleSubmit,
  } = props

  const theme = useTheme()

  const {
    widgetBodyText = '',
    CreateAccountButtonText,
  } = loginInfo

  return (
    <Box sx={{
      padding: '20px',
      background: '#F5F5F5',
    }}
    >
      <LoginWidget
        sx={{
          minHeight: '250px',
        }}
        isVisible
        html={widgetBodyText}
      />
      <Box sx={{
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
