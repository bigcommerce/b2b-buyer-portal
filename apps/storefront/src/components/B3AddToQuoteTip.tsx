import { Box, Button } from '@mui/material'

interface B3AddToQuoteTipProps {
  gotoQuoteDraft: () => void
}

export default function B3AddToQuoteTip(props: B3AddToQuoteTipProps) {
  const { gotoQuoteDraft } = props

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
        Product was added to your quote.
      </Box>
      <Button
        onClick={() => gotoQuoteDraft()}
        variant="text"
        sx={{
          color: '#ffffff',
        }}
      >
        OPEN QUOTE
      </Button>
    </Box>
  )
}
