import { Link } from 'react-router-dom';
import { useB3Lang } from '@b3/lang';
import { Alert, Box, Typography } from '@mui/material';

export function UpgradeBanner() {
  const b3Lang = useB3Lang();

  return (
    <Box>
      <Alert
        severity="info"
        variant="filled"
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
      >
        <Box display="flex" flexWrap="wrap" justifyContent="space-between" width="100%">
          <Box>
            <Typography variant="subtitle1" fontWeight="800">
              {b3Lang('accountSettings.registeredToB2b.title')}
            </Typography>
            <Typography sx={{ textWrap: 'wrap' }}>
              {b3Lang('accountSettings.registeredToB2b.description')}
            </Typography>
          </Box>
          <Typography
            component={Link}
            to="/registeredbctob2b"
            sx={{ textDecoration: 'none', textTransform: 'uppercase' }}
            fontWeight="bold"
            color="#fff"
          >
            {b3Lang('accountSettings.registeredToB2b.upgrade')}
          </Typography>
        </Box>
      </Alert>
    </Box>
  );
}
