import { Box, Typography } from '@mui/material';

import { useB3Lang } from '@/lib/lang';
import { useAppSelector } from '@/store';

interface BackorderMessageProps {
  totalOnHand?: number;
  quantityBackordered?: number;
  backorderMessage?: string;
  visible: boolean;
}

function BackorderMessage({
  totalOnHand,
  quantityBackordered,
  backorderMessage,
  visible,
}: BackorderMessageProps) {
  const b3Lang = useB3Lang();
  const { showQuantityOnBackorder, showQuantityOnHand, showBackorderMessage } = useAppSelector(
    ({ global }) => global.backorderDisplaySettings,
  );

  if ((quantityBackordered ?? 0) <= 0) return null;

  return (
    <Box sx={{ visibility: visible ? 'visible' : 'hidden' }}>
      {showQuantityOnHand && (totalOnHand ?? 0) > 0 && (
        <Typography variant="body1" color="#616161">
          {b3Lang('quoteDetail.table.readyToShip', { totalOnHand: totalOnHand ?? 0 })}
        </Typography>
      )}
      {showQuantityOnBackorder && (
        <Typography variant="body1" color="#616161">
          {b3Lang('quoteDetail.table.willBeBackordered', {
            quantityBackordered: quantityBackordered ?? 0,
          })}
        </Typography>
      )}
      {showBackorderMessage && backorderMessage && (
        <Typography variant="body1" color="#616161">
          {backorderMessage}
        </Typography>
      )}
    </Box>
  );
}

export default BackorderMessage;
