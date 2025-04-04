/* eslint-disable react/function-component-definition */
import { FC } from 'react';
import { useB3Lang } from '@b3/lang';
import { Box, Typography } from '@mui/material';

// Pages shared between Stencil and Catalyst would need
// - a solution to swap styled component libraries
// - a solution to populate app level state (globals like logo, etc)
// - a solution to share/provide own translations (catalyst passes strings in as props)
// - catalyst has gone all in on `conform`: https://conform.guide/ - might dictate our I/O signatures
// Catalyst version: https://github.com/bigcommerce/catalyst/blob/17d72cac3c1183f78856f3f4af99312695fa5b26/core/vibes/soul/sections/forgot-password-section/index.tsx

export const View: FC = () => {
  const b3Lang = useB3Lang();

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
        {b3Lang('forgotPassword.resetPassword')}
      </Typography>
      <Typography variant="body1">
        Please contact Customer Support in order to reset your password.
      </Typography>
    </Box>
  );
};
