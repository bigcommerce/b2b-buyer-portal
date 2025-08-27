import { Box, Typography } from '@mui/material';

import { useB3Lang } from '@/lib/lang';

interface LoadingProps {
  backColor?: string;
}

function Loading({ backColor }: LoadingProps) {
  const b3Lang = useB3Lang();

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        backgroundColor: backColor || 'background.default',
        zIndex: 99999999995,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Typography
        role="progressbar"
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'black',
        }}
      >
        {b3Lang('global.tips.loading')}
      </Typography>
    </Box>
  );
}

export default Loading;
