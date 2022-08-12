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
      {/* <Box sx={{
        marginBottom: '20px',
      }}
      >
        {loginInfo.createAccountPanelTittle}
      </Box> */}

      <LoginWidget
        sx={{
          height: '250px',
          backgroundColor: '#FFFFFF',
        }}
        isVisible
        html={widgetBodyText}
      />
      <Box sx={{
        marginTop: '10px',
      }}
      >
        <B3Button
          btnColor={btnColor}
          type="submit"
          onClick={handleSubmit}
          variant="contained"
          sx={{
            mt: 3,
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
