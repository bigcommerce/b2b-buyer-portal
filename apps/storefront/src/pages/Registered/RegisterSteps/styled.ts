import styled from '@emotion/styled';
import { Box } from '@mui/material';

export const StyleTipContainer = styled('p')(() => ({
  margin: '2rem auto',
}));

export const InformationFourLabels = styled('h4')(() => ({
  marginBottom: '20px',
}));

export const TipContent = styled('div')({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
});

export const StyledRegisterContent = styled(Box)({
  '& #b3-customForm-id-name': {
    '& label[data-shrink="true"]': {
      whiteSpace: 'break-spaces',
      minWidth: 'calc(133% - 24px)',
      transition: 'unset',
    },

    '& label[data-shrink="false"]': {
      whiteSpace: 'break-spaces',
    },
  },
});
