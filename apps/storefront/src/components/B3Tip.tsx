import { Alert, AlertTitle, Box, Snackbar } from '@mui/material'

import { useMobile } from '@/hooks'
import {
  MsgsProps,
  TipMessagesProps,
} from '@/shared/dynamicallyVariable/context/config'

interface B3TipProps extends TipMessagesProps {
  handleItemClose: (id: number | string) => void
  handleAllClose: (id: string | number, reason: string) => void
}

export default function B3Tip({
  handleItemClose,
  vertical = 'bottom',
  horizontal = 'right',
  msgs = [],
  handleAllClose,
}: B3TipProps) {
  const [isMobile] = useMobile()
  if (!msgs || !msgs.length) return null
  return (
    <Box>
      {msgs.length > 0
        ? msgs.map((msg: MsgsProps, index: number) => (
            <Snackbar
              key={msg.id}
              open={!!msg?.id}
              autoHideDuration={msg?.time || 5000}
              onClose={(e, reason: string) => handleAllClose(msg.id, reason)}
              disableWindowBlurListener
              anchorOrigin={{
                vertical,
                horizontal,
              }}
              sx={{
                top: `${
                  24 + index * 8 + index * (isMobile ? 70 : 60)
                }px !important`,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                }}
              >
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
              </Box>
            </Snackbar>
          ))
        : null}
    </Box>
  )
}
