import { Box, Button } from '@mui/material';
import { ReactNode } from 'react';

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
          sx={{
            color: '#ffffff',
            padding: 0,
          }}
          variant="text"
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
}
