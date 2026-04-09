import styled from '@emotion/styled';
import { Box } from '@mui/material';

export const InformationFourLabels = styled('h4')(() => ({
  marginBottom: '20px',
}));

export const TipContent = styled('div')({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
});

export const InformationLabels = styled('h3')(() => ({
  margin: '1rem 0',
  display: 'flex',
  justifyContent: 'center',
  fontSize: '34px',
  fontWeight: '400',
}));

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
