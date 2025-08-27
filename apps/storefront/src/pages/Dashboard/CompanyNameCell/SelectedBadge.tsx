import { Box } from '@mui/material';

import { useB3Lang } from '@/lib/lang';

export function SelectedBadge() {
  const b3Lang = useB3Lang();

  return (
    <Box
      sx={{
        fontWeight: 400,
        fontSize: '13px',
        background: '#ED6C02',
        ml: '16px',
        p: '2px 7px',
        color: '#FFFFFF',
        borderRadius: '10px',
      }}
    >
      {b3Lang('dashboard.selected')}
    </Box>
  );
}
