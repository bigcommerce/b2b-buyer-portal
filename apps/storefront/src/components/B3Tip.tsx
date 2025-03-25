import { Alert, AlertTitle, Box, Snackbar } from '@mui/material';

import useMobile from '@/hooks/useMobile';
import { MsgsProps, TipMessagesProps } from '@/shared/dynamicallyVariable/context/config';

interface B3TipProps extends TipMessagesProps {
  handleItemClose: (id: number | string) => void;
  handleAllClose: (id: string | number, reason: string) => void;
}

function MessageAlert({
  msg,
  onClose,
}: {
  msg: MsgsProps;
  onClose: (id: string | number) => void;
}) {
  const Body = msg.jsx ? msg.jsx : () => <span>{msg.msg}</span>;

  return (
    <Alert
      sx={{
        width: '320px',
        alignItems: 'center',
        '& button[title="Close"]': {
          display: msg.isClose ? 'block' : 'none',
        },
        mb: '5px',

        '& .MuiAlert-message': {
          overflow: 'unset',
        },
      }}
      variant="filled"
      key={msg.id}
      severity={msg.type}
      onClose={() => msg.isClose && onClose(msg.id)}
    >
      {msg.title && <AlertTitle>{msg.title}</AlertTitle>}
      <Body />
    </Alert>
  );
}

export default function B3Tip({
  handleItemClose,
  vertical = 'bottom',
  horizontal = 'right',
  msgs = [],
  handleAllClose,
}: B3TipProps) {
  const [isMobile] = useMobile();
  if (!msgs || !msgs.length) return null;
  return (
    <Box>
      {msgs.length > 0
        ? msgs.map((msg: MsgsProps, index: number) => (
            <Snackbar
              key={msg.id}
              open={!!msg?.id}
              autoHideDuration={msg?.time || 5000}
              onClose={(_, reason: string) => handleAllClose(msg.id, reason)}
              disableWindowBlurListener
              anchorOrigin={{
                vertical,
                horizontal,
              }}
              sx={{
                top: `${24 + index * 10 + index * (isMobile ? 80 : 90)}px !important`,
                width: '320px',
                height: 'auto',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                }}
              >
                <MessageAlert msg={msg} onClose={handleItemClose} />
              </Box>
            </Snackbar>
          ))
        : null}
    </Box>
  );
}
