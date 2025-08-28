import { Box, Button, useTheme } from '@mui/material';
import { Link } from 'react-router-dom';

import { useMobile } from '@/hooks';

import LoginWidget from './component/LoginWidget';

interface LoginPanelProps {
  widgetBodyText: string;
  createAccountButtonText: string;
}

function LoginPanel(props: LoginPanelProps) {
  const { widgetBodyText, createAccountButtonText } = props;

  const theme = useTheme();
  const [isMobile] = useMobile();

  return (
    <Box
      sx={{
        padding: isMobile ? '16px' : '20px',
        borderRadius: '4px',
        mt: isMobile ? '0' : '-25px',
      }}
    >
      <LoginWidget
        html={widgetBodyText}
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
      />
      <Box
        sx={{
          marginTop: '5px',
        }}
      >
        <Button
          component={Link}
          sx={{
            ml: isMobile ? 0 : 1,
            backgroundColor: theme.palette.primary.main,
          }}
          to="/register"
          variant="contained"
        >
          {createAccountButtonText}
        </Button>
      </Box>
    </Box>
  );
}

export default LoginPanel;
