import { type MouseEvent } from 'react';
import { Box } from '@mui/material';

import CustomButton from '@/components/button/CustomButton';
import { useB3Lang } from '@/lib/lang';

interface SubmitRowProps {
  onSubmit: (event: MouseEvent) => void;
}

export function SubmitRow({ onSubmit }: SubmitRowProps) {
  const b3Lang = useB3Lang();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row-reverse',
        pt: 2,
        width: '100%',
      }}
    >
      <CustomButton variant="contained" onClick={onSubmit}>
        {b3Lang('global.button.submit')}
      </CustomButton>
    </Box>
  );
}
