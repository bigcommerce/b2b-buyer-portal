import { Box, Typography } from '@mui/material';

import BackorderMessage from '@/components/BackorderMessage';
import type { ProductSearch } from '@/shared/service/b2b/graphql/product';
import {
  getCatalogBackorderFieldsForPicklistProduct,
  type PicklistSelection,
} from '@/utils/catalogBackorderDisplay';

interface PicklistBackorderMessagesProps {
  selections: PicklistSelection[];
  picklistProductsById: Record<number, ProductSearch>;
  qty: number;
  visible: boolean;
  backorderUiEnabled: boolean;
}

function PicklistBackorderMessages({
  selections,
  picklistProductsById,
  qty,
  visible,
  backorderUiEnabled,
}: PicklistBackorderMessagesProps) {
  if (!backorderUiEnabled || selections.length === 0 || !visible) {
    return null;
  }

  return (
    <>
      {selections.map((selection) => {
        const backorderFields = getCatalogBackorderFieldsForPicklistProduct(
          qty,
          picklistProductsById[selection.productId],
        );

        if (!backorderFields) {
          return null;
        }

        return (
          <Box key={selection.modifierId} sx={{ mt: 1, width: '100%' }}>
            <Typography sx={{ color: '#616161', typography: 'body2' }}>
              {`${selection.displayName}:`}
            </Typography>
            <BackorderMessage
              totalOnHand={backorderFields.totalOnHand}
              quantityBackordered={backorderFields.quantityBackordered}
              backorderMessage={backorderFields.backorderMessage}
              visible
            />
          </Box>
        );
      })}
    </>
  );
}

export default PicklistBackorderMessages;
