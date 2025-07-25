import { ReactNode } from 'react';
import { Box, Button } from '@mui/material';

interface TipBodyProps {
  action?: {
    label: string;
    onClick: () => void;
  };
  message: ReactNode;
  description?: string;
}

export default function TipBody(props: TipBodyProps) {
  const { action, message, description } = props;

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
        {description && (
          <p
            style={{
              margin: 0,
            }}
          >
            {description}
          </p>
        )}
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
