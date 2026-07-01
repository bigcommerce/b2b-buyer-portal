import { Box, Typography } from '@mui/material';

import BackorderMessage from '@/components/BackorderMessage';
import type { ProductSearch } from '@/shared/service/b2b/graphql/product';
import type { BackorderDisplayFields } from '@/utils/backorderDisplayFromInventory';
import {
  getCatalogBackorderFieldsForPicklistProduct,
  type PicklistSelection,
} from '@/utils/catalogBackorderDisplay';

interface PicklistSelectionBackorderMessageProps {
  selection: PicklistSelection;
  product: ProductSearch | undefined;
  qty: number;
  backorderFields?: BackorderDisplayFields | null;
}

function PicklistSelectionBackorderMessage({
  selection,
  product,
  qty,
  backorderFields,
}: PicklistSelectionBackorderMessageProps) {
  const resolvedFields =
    backorderFields === undefined
      ? getCatalogBackorderFieldsForPicklistProduct(qty, product)
      : backorderFields;

  if (!resolvedFields) {
    return null;
  }

  return (
    <Box sx={{ mt: 1, width: '100%' }}>
      <Typography sx={{ color: '#616161', typography: 'body2' }}>
        {`${selection.displayName}:`}
      </Typography>
      <BackorderMessage
        totalOnHand={resolvedFields.totalOnHand}
        quantityBackordered={resolvedFields.quantityBackordered}
        backorderMessage={resolvedFields.backorderMessage}
        visible
      />
    </Box>
  );
}

export default PicklistSelectionBackorderMessage;
