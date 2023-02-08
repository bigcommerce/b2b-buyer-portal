import {
  Box,
} from '@mui/material'
import LoginWidget from './component/LoginWidget'

import {
  LoginInfoInit,
} from './config'

import {
  B3Button,
} from './styled'

interface LoginPanelProps {
  loginInfo: Partial<LoginInfoInit>;
  handleSubmit?: () => void;
}

const LoginPanel = (props: LoginPanelProps) => {
  const {
    loginInfo,
    handleSubmit,
  } = props

  const {
    widgetBodyText = '',
    CreateAccountButtonText,
    btnColor,
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
        <B3Button
          btnColor={btnColor}
          type="submit"
          onClick={handleSubmit}
          variant="contained"
          sx={{
            ml: 1,
          }}
        >
          {CreateAccountButtonText}
        </B3Button>
      </Box>
    </Box>
  )
}

export default LoginPanel
