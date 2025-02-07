import { Box } from '@mui/material';

import { SelectedBadge } from './SelectedBadge';

interface CompanyNameCellProps {
  companyName: string;
  isSelected: boolean;
}
export function CompanyNameCell({ companyName, isSelected }: CompanyNameCellProps) {
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
