import { styled } from '@mui/material/styles';

interface LoginContainerProps {
  paddings: string;
}

export const LoginContainer = styled('div')(({ paddings }: LoginContainerProps) => ({
  padding: paddings,
}));

export const LoginImage = styled('div')({
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
