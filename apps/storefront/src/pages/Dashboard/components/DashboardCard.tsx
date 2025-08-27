import { Box, Button, Card, CardContent, Typography } from '@mui/material';

import { useB3Lang } from '@/lib/lang';

interface DashboardCardProps {
  companyName: string;
  email: string;
  isSelected: boolean;
  action: { label: string; onClick: () => void };
}

function SelectedBadge() {
  const b3Lang = useB3Lang();

  return (
    <Box
      sx={{
        fontWeight: 400,
        fontSize: '13px',
        background: '#ED6C02',
        display: 'inline-block',
        p: '2px 7px',
        color: '#FFFFFF',
        borderRadius: '10px',
      }}
    >
      {b3Lang('dashboard.selected')}
    </Box>
  );
}

export function DashboardCard({ companyName, email, isSelected, action }: DashboardCardProps) {
  return (
    <Card>
      <CardContent
        sx={{
          color: '#313440',
        }}
      >
        <Typography
          sx={{
            fontWeight: 400,
            fontSize: '24px',
            color: 'rgba(0, 0, 0, 0.87)',
          }}
        >
          {companyName}
        </Typography>

        {isSelected && <SelectedBadge />}

        <Box
          sx={{
            display: 'flex',
            fontSize: '16px',
            mt: '15px',
            gap: '5px',
          }}
        >
          <Typography
            sx={{
              fontWeight: 500,
            }}
          >
            Email:
          </Typography>
          <Typography variant="body1">{email}</Typography>
        </Box>
      </CardContent>

      <Button
        sx={{
          ml: '10px',
          mb: '10px',
        }}
        variant="text"
        onClick={() => action.onClick()}
      >
        {action.label}
      </Button>
    </Card>
  );
}
