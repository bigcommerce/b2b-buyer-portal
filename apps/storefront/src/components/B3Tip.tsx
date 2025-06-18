import { Alert, AlertTitle, Box, Snackbar } from '@mui/material';

import useMobile from '@/hooks/useMobile';
import { MsgsProps, TipMessagesProps } from '@/shared/dynamicallyVariable/context/config';
import { platform } from '@/utils';

interface B3TipProps extends TipMessagesProps {
  handleItemClose: (id: number | string) => void;
  handleAllClose: (id: string | number, reason: string) => void;
}

interface AlertProps {
  msg: MsgsProps;
  onClose: (id: string | number) => void;
}

function MessageAlert({ msg, onClose }: AlertProps) {
  const Body = msg.jsx ? msg.jsx : () => <span>{msg.msg}</span>;

  return (
    <Alert
      sx={{
        alignItems: 'center',
        '& button[title="Close"]': {
          display: msg.isClose ? 'block' : 'none',
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
      onClose={() => msg.isClose && onClose(msg.id)}
    >
      {msg.title && <AlertTitle>{msg.title}</AlertTitle>}
      <Body />
    </Alert>
  );
}

const CatalystColors = {
  success: 'color-mix(in oklab, oklch(83.77% 0.214 142.31), white 75%)',
  warning: 'color-mix(in oklab, oklch(83.42% 0.159 79.51), white 75%)',
  info: 'color-mix(in oklab, oklch(49.07% 0.177 262.04), white 75%)',
  error: 'color-mix(in oklab, oklch(64.89% 0.237 26.97), white 75%)',
};

function CatalystAlert({ msg, onClose }: AlertProps) {
  const Body = msg.jsx
    ? msg.jsx
    : () => (
        <span
          style={{
            textWrap: 'wrap',
          }}
        >
          {msg.msg}
        </span>
      );

  return (
    <Alert
      sx={{
        background: CatalystColors[msg.type],
        boxShadow: '0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 2px 0 rgba(0, 0, 0, 0.05);',
        borderStyle: 'solid',
        borderWidth: '1px',
        borderColor: 'oklab(0.1822 0 0 / 0.1)',
        borderRadius: '12px',
        alignItems: 'center',
        minWidth: '284px',
        mb: '5px',
        padding: '12px 12px 12px 16px',
        color: '#000',
        fontWeight: 400,
        letterSpacing: 'normal',
        fontSize: '14px',
        fontFamily:
          'ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji',
        textWrap: 'auto',

        '& button[title="Close"]': {
          display: msg.isClose ? 'flex' : 'none',
        },

        '& .MuiAlert-message': {
          overflow: 'unset',
          padding: 0,
          whiteSpace: 'nowrap',
        },
      }}
      variant="filled"
      icon={false}
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
                {platform === 'catalyst' ? (
                  <CatalystAlert msg={msg} onClose={handleItemClose} />
                ) : (
                  <MessageAlert msg={msg} onClose={handleItemClose} />
                )}
              </Box>
            </Snackbar>
          ))
        : null}
    </Box>
  );
}
