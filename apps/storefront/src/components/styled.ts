import { Close } from '@mui/icons-material';
import { Box, TextField } from '@mui/material';
import { createTheme, styled } from '@mui/material/styles';

const theme = createTheme({
  breakpoints: {
    values: {
      xs: 380,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
});

export const CloseButton = styled(Close)(() => ({
  cursor: 'pointer',
}));

export const CloseBox = styled(Box)(() => ({
  position: 'absolute',
  top: 15,
  right: 20,
}));

export const CloseBoxMobile = styled(Box)(() => ({}));

export const CardContainer = styled('div')(() => ({
  padding: '20px 20px',

  [theme.breakpoints.down('xs')]: {
    padding: '10px 10px',
  },

  [theme.breakpoints.down('sm')]: {
    padding: '16px 16px',
  },
}));

export const StyledNumberNoTopTextField = styled(TextField)(() => ({
  '& input': {
    paddingRight: '6px',
  },
}));
