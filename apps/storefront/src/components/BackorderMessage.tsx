import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

import { useB3Lang } from '@/lib/lang';
import { useAppSelector } from '@/store';

interface BackorderMessageProps {
  totalOnHand?: number;
  quantityBackordered?: number;
  backorderMessage?: string;
  visible: boolean;
}

const quantityLineSx: SxProps<Theme> = {
  color: '#616161',
  typography: 'body2',
  whiteSpace: 'nowrap',
};

const messageLineSx: SxProps<Theme> = {
  color: '#616161',
  typography: 'body2',
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
};

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
  if (!visible) return null;

  return (
    <Box>
      {showQuantityOnHand && (totalOnHand ?? 0) > 0 && (
        <Typography sx={quantityLineSx}>
          {b3Lang('quoteDetail.table.readyToShip', { totalOnHand: totalOnHand ?? 0 })}
        </Typography>
      )}
      {showQuantityOnBackorder && (
        <Typography sx={quantityLineSx}>
          {b3Lang('quoteDetail.table.willBeBackordered', {
            quantityBackordered: quantityBackordered ?? 0,
          })}
        </Typography>
      )}
      {showBackorderMessage && backorderMessage && (
        <Typography sx={messageLineSx}>{backorderMessage}</Typography>
      )}
    </Box>
  );
}

export default BackorderMessage;
