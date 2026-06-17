import { Box, Typography } from '@mui/material';

import BackorderMessage from '@/components/BackorderMessage';
import type { ProductSearch } from '@/shared/service/b2b/graphql/product';
import {
  getCatalogBackorderFieldsForPicklistProduct,
  type PicklistSelection,
} from '@/utils/catalogBackorderDisplay';

interface PicklistSelectionBackorderMessageProps {
  selection: PicklistSelection;
  product: ProductSearch | undefined;
  qty: number;
}

function PicklistSelectionBackorderMessage({
  selection,
  product,
  qty,
}: PicklistSelectionBackorderMessageProps) {
  const backorderFields = getCatalogBackorderFieldsForPicklistProduct(qty, product);

  if (!backorderFields) {
    return null;
  }

  return (
    <Box sx={{ mt: 1, width: '100%' }}>
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
}

export default PicklistSelectionBackorderMessage;
