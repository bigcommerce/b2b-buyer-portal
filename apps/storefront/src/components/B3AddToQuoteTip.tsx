import { Box, Button } from '@mui/material'

interface B3AddToQuoteTipProps {
  gotoQuoteDraft: () => void
  msg: string
}

export default function B3AddToQuoteTip(props: B3AddToQuoteTipProps) {
  const { gotoQuoteDraft, msg } = props

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
        {msg}
      </Box>
      <Button
        onClick={() => gotoQuoteDraft()}
        variant="text"
        sx={{
          color: '#ffffff',
          padding: 0,
        }}
      >
        OPEN QUOTE
      </Button>
    </Box>
  )
}
