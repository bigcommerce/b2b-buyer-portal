import { Box } from '@mui/material';

import { SelectedBadge } from './SelectedBadge';

interface Props {
  companyName: string;
  isSelected: boolean;
}

export function CompanyNameCell({ companyName, isSelected }: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {companyName}
      {isSelected && <SelectedBadge />}
    </Box>
  );
}
