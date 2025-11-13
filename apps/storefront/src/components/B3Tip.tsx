import { Alert, Box, Snackbar } from '@mui/material';

import { useMobile } from '@/hooks/useMobile';
import { MsgsProps, TipMessagesProps } from '@/shared/dynamicallyVariable/context/config';

import TipBody from './TipBody';

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
  return (
    <Alert
      sx={{
        alignItems: 'center',
        '& button[title="Close"]': {
          display: 'block',
        },
        mb: '5px',

        '& .MuiAlert-message': {
          overflow: 'unset',
          whiteSpace: 'nowrap',
        },
      }}
      variant="filled"
      key={msg.id}
      severity={msg.type}
      onClose={() => onClose(msg.id)}
    >
      <TipBody action={msg.action} message={msg.msg} description={msg.description} />
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
