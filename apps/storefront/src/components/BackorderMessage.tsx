import { Box, Typography } from '@mui/material';

import { useB3Lang } from '@/lib/lang';

interface BackorderMessageProps {
  totalOnHand?: number;
  quantityBackordered?: number;
  backorderMessage?: string;
  visible?: boolean;
}

function BackorderMessage({
  totalOnHand,
  quantityBackordered,
  backorderMessage,
  visible = true,
}: BackorderMessageProps) {
  const b3Lang = useB3Lang();

  if ((quantityBackordered ?? 0) <= 0) return null;

  return (
    <Box sx={{ visibility: visible ? 'visible' : 'hidden' }}>
      {(totalOnHand ?? 0) > 0 && (
        <Typography sx={{ fontSize: '0.9rem' }}>
          {b3Lang('quoteDetail.table.readyToShip', { totalOnHand: totalOnHand ?? 0 })}
        </Typography>
      )}
      <Typography sx={{ fontSize: '0.9rem' }}>
        {b3Lang('quoteDetail.table.willBeBackordered', {
          quantityBackordered: quantityBackordered ?? 0,
        })}
      </Typography>
      {backorderMessage && <Typography sx={{ fontSize: '0.9rem' }}>{backorderMessage}</Typography>}
    </Box>
  );
}

export default BackorderMessage;
