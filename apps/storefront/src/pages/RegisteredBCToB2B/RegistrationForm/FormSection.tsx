import type { ReactNode } from 'react';
import { Box } from '@mui/material';

interface FormSectionProps {
  children: ReactNode;
}

export function FormSection({ children }: FormSectionProps) {
  return (
    <Box
      sx={{
        width: '100%',
      }}
    >
      {children}
    </Box>
  );
}
