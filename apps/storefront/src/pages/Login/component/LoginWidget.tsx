import { Box, SxProps } from '@mui/material';

interface LoginWidgetProps {
  sx: SxProps;
  html: string;
}

function LoginWidget(props: LoginWidgetProps) {
  const { html, sx } = props;

  return (
    <Box
      sx={{
        ...sx,
      }}
      dangerouslySetInnerHTML={{
        __html: html,
      }}
    />
  );
}

export default LoginWidget;
