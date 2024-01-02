import { Box, Button, Card, CardContent, Typography } from '@mui/material'

interface CustomField {
  [key: string]: string | number
}

interface DashboardCardProps {
  row: CustomField
  startActing: (id: number) => void
  endActing: () => void
  salesRepCompanyId?: number
}

function DashboardCard({
  row,
  startActing,
  endActing,
  salesRepCompanyId = 0,
}: DashboardCardProps) {
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
          {row.companyName}
        </Typography>

        {row.companyId === +salesRepCompanyId && (
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
            Selected
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            fontSize: '16px',
            mt: '15px',
          }}
        >
          <Typography
            sx={{
              fontWeight: 500,
            }}
          >
            Email:
          </Typography>
          <Typography variant="body1">{row.companyEmail}</Typography>
        </Box>
      </CardContent>

      {row.companyId === +salesRepCompanyId ? (
        <Button
          sx={{
            ml: '10px',
            mb: '10px',
          }}
          variant="text"
          onClick={() => endActing()}
        >
          End MASQUERADE
        </Button>
      ) : (
        <Button
          sx={{
            ml: '10px',
            mb: '10px',
          }}
          variant="text"
          onClick={() => startActing((row as CustomFieldItems).companyId)}
        >
          MASQUERADE
        </Button>
      )}
    </Card>
  )
}

export default DashboardCard
