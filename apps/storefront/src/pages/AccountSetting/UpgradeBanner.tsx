import { useB3Lang } from '@b3/lang';
import { Alert, Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export function UpgradeBanner() {
  const b3Lang = useB3Lang();

  return (
    <Box>
      <Alert
        severity="info"
        sx={{
          width: 'inherit',
          '& button[title="Close"]': {
            display: 'block',
          },
          mb: '24px',
          maxWidth: '1450px',

          '& .MuiAlert-icon': {
            padding: '12px 0',
          },

          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
        variant="filled"
      >
        <Box display="flex" flexWrap="wrap" justifyContent="space-between" width="100%">
          <Box>
            <Typography fontWeight="800" variant="subtitle1">
              {b3Lang('accountSettings.registeredToB2b.title')}
            </Typography>
            <Typography sx={{ textWrap: 'wrap' }}>
              {b3Lang('accountSettings.registeredToB2b.description')}
            </Typography>
          </Box>
          <Typography
            color="#fff"
            component={Link}
            fontWeight="bold"
            sx={{ textDecoration: 'none', textTransform: 'uppercase' }}
            to="/registeredbctob2b"
          >
            {b3Lang('accountSettings.registeredToB2b.upgrade')}
          </Typography>
        </Box>
      </Alert>
    </Box>
  );
}
