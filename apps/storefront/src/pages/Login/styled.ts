import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

interface LoginContainerProps {
  paddings: string;
}

export const LoginContainer = styled('div')(({ paddings }: LoginContainerProps) => ({
  padding: paddings,
}));

export const LoginImageContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  height: '100%',
});

export const B3ResetPassWordButton = styled('div')({
  margin: '16px 0 20px 16px',
});

interface LoginAndRegisterContainerProps {
  containerWidth: string;
  flexDirection: 'row' | 'column';
}

export const LoginAndRegisterContainer = styled(Box, {
  shouldForwardProp: (prop) => !['containerWidth', 'flexDirection'].includes(prop as string),
})(({ containerWidth, flexDirection }: LoginAndRegisterContainerProps) => ({
  backgroundColor: '#FFFFFF',
  borderRadius: '4px',
  margin: '20px 0',
  display: 'flex',
  flexDirection,
  justifyContent: 'center',
  width: containerWidth,
  marginBottom: '20px',
}));
