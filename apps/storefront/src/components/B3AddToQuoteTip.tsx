import { useB3Lang } from '@b3/lang'
import { Box, Button } from '@mui/material'

interface B3AddToQuoteTipProps {
  gotoQuoteDraft: () => void
  msg: string
}

export default function B3AddToQuoteTip(props: B3AddToQuoteTipProps) {
  const { gotoQuoteDraft, msg } = props
  const b3Lang = useB3Lang()
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
        {b3Lang(msg)}
      </Box>
      <Button
        onClick={() => gotoQuoteDraft()}
        variant="text"
        sx={{
          color: '#ffffff',
          padding: 0,
        }}
      >
        {b3Lang('quoteDraft.notification.openQuote')}
      </Button>
    </Box>
  )
}
