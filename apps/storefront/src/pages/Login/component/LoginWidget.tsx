import { Box, SxProps } from '@mui/material';

interface LoginWidgetProps {
  sx: SxProps;
  html: string;
}

function LoginWidget(props: LoginWidgetProps) {
  const { html, sx } = props;

  return (
    <Box
      dangerouslySetInnerHTML={{
        __html: html,
      }}
      sx={{
        ...sx,
      }}
    />
  );
}

export default LoginWidget;
