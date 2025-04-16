/* eslint-disable react/function-component-definition */
import { FC } from 'react';
import { Box, Typography } from '@mui/material';

interface Props {
  title: string;
  message: string;
}

export const ForgotPasswordSection: FC<Props> = ({ title, message }) => {
  return (
    <Box
      sx={{
        bgcolor: '#FFFFFF',
        borderRadius: '4px',
        marginX: 'auto',
        maxWidth: '537px',
        padding: '20px',
      }}
    >
      <Typography variant="h5" sx={{ marginBottom: '16px', textAlign: 'center' }}>
        {title}
      </Typography>
      <Typography variant="body1">{message}</Typography>
    </Box>
  );
};
