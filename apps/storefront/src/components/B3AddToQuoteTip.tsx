import { ReactNode } from 'react';
import { useB3Lang } from '@b3/lang';
import { Box, Button } from '@mui/material';

import { platform } from '@/utils';

interface B3AddToQuoteTipProps {
  gotoQuoteDraft: () => void;
  msg: string;
}

function CatalystButton({
  goToQuoteDraft,
  children,
}: {
  goToQuoteDraft: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      onClick={() => goToQuoteDraft()}
      variant="text"
      sx={{
        color: '#000',
        fontWeight: 800,
        padding: 0,
        textTransform: 'none',
      }}
    >
      {children}
    </Button>
  );
}

export default function B3AddToQuoteTip(props: B3AddToQuoteTipProps) {
  const { gotoQuoteDraft, msg } = props;
  const b3Lang = useB3Lang();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          mr: platform === 'catalyst' ? '52px' : '15px',
        }}
      >
        {b3Lang(msg)}
      </Box>
      {platform === 'catalyst' ? (
        <CatalystButton goToQuoteDraft={gotoQuoteDraft}>
          {b3Lang('quoteDraft.notification.openQuote')}
        </CatalystButton>
      ) : (
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
      )}
    </Box>
  );
}
