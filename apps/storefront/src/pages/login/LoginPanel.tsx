import { Box, useTheme } from '@mui/material';

import CustomButton from '@/components/button/CustomButton';
import { useMobile } from '@/hooks';

import LoginWidget from './component/LoginWidget';
import { LoginInfoInit } from './config';

interface LoginPanelProps {
  loginInfo: Partial<LoginInfoInit>;
  handleSubmit?: () => void;
}

function LoginPanel(props: LoginPanelProps) {
  const { loginInfo, handleSubmit } = props;

  const theme = useTheme();
  const [isMobile] = useMobile();

  const { widgetBodyText = '', CreateAccountButtonText } = loginInfo;

  return (
    <Box
      sx={{
        padding: isMobile ? '16px' : '20px',
        borderRadius: '4px',
        mt: isMobile ? '0' : '-25px',
      }}
    >
      <LoginWidget
        sx={{
          minHeight: '250px',
          '& .panel': {
            '.panel-title': {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              fontWeight: 400,
              fontSize: '24px',
            },
          },
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
            ml: isMobile ? 0 : 1,
            backgroundColor: theme.palette.primary.main,
          }}
        >
          {CreateAccountButtonText}
        </CustomButton>
      </Box>
    </Box>
  );
}

export default LoginPanel;
