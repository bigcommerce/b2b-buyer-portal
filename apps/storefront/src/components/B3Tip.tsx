import { Alert, AlertTitle, Box, Snackbar } from '@mui/material'

import {
  MsgsProps,
  TipMessagesProps,
} from '@/shared/dynamicallyVariable/context/config'

interface B3TipProps extends TipMessagesProps {
  handleItemClose: (id: number | string) => void
  handleAllClose: () => void
}

export default function B3Tip({
  autoHideDuration = 3000,
  handleItemClose,
  vertical = 'bottom',
  horizontal = 'right',
  msgs = [],
  handleAllClose,
}: B3TipProps) {
  if (!msgs || !msgs.length) return null
  return (
    <Snackbar
      open={!!msgs.length}
      autoHideDuration={autoHideDuration}
      onClose={handleAllClose}
      anchorOrigin={{
        vertical,
        horizontal,
      }}
    >
      <Box>
        {msgs.length &&
          msgs.map((msg: MsgsProps) => (
            <Alert
              sx={{
                width: '100%',
                alignItems: 'center',
                '& button[title="Close"]': {
                  display: `${msg.isClose ? 'block' : 'none'}`,
                },
                mb: '5px',
              }}
              variant="filled"
              key={msg.id}
              severity={msg.type}
              onClose={() => msg.isClose && handleItemClose(msg.id)}
            >
              {msg?.title && <AlertTitle>{msg.title}</AlertTitle>}
              {msg.jsx ? msg.jsx() : msg.msg}
            </Alert>
          ))}
      </Box>
    </Snackbar>
  )
}
