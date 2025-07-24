import { ReactNode } from 'react';
import { Box, Button } from '@mui/material';

interface TipBodyProps {
  action?: {
    label: string;
    onClick: () => void;
  };
  message: ReactNode;
}

export default function TipBody(props: TipBodyProps) {
  const { action, message } = props;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          mr: '15px',
        }}
      >
        {message}
      </Box>
      {action && (
        <Button
          onClick={action.onClick}
          variant="text"
          sx={{
            color: '#ffffff',
            padding: 0,
          }}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
}
