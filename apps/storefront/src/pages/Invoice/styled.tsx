import { Box, styled } from '@mui/material';

const InvocieTabs = styled(Box)((props: { isMobile: boolean }) => ({
  marginBottom: '1rem',

  '& #invocies-list-tabId': {
    '& button': {
      width: props.isMobile ? '50%' : '22%',
    },
  },
}));

export { InvocieTabs };
