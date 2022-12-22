import {
  AlertTitle,
  Alert,
  Snackbar,
  Box,
} from '@mui/material'

import {
  TipMessagesProps,
  MsgsProps,
} from '@/shared/global/context/config'

interface B3TipProps extends TipMessagesProps {
  handleItemClose?: (id: number | string) => void,
  handleAllClose: () => void,
}

export const B3Tip = ({
  autoHideDuration = 3000,
  handleItemClose,
  vertical = 'bottom',
  horizontal = 'right',
  msgs = [],
  handleAllClose,
}: B3TipProps) => {
  if (!msgs || !msgs.length) return null
  return (
    <Snackbar
      open={!!msgs.length}
      autoHideDuration={autoHideDuration}
      onClose={handleAllClose}
      anchorOrigin={{
        vertical, horizontal,
      }}
    >
      <Box>
        {
          msgs.length && msgs.map((msg: MsgsProps) => (
            <Alert
              sx={{
                width: '100%',
                alignItems: 'center',
                '& button[title="Close"]': {
                  display: `${handleItemClose ? 'block' : 'none'}`,
                },
              }}
              key={msg.id}
              severity={msg.type}
              onClose={() => handleItemClose && handleItemClose(msg.id)}
            >
              {msg?.title && <AlertTitle>{msg.title}</AlertTitle>}
              {
                msg.jsx ? msg.jsx() : msg.msg
              }
            </Alert>
          ))
        }
      </Box>
    </Snackbar>
  )
}
