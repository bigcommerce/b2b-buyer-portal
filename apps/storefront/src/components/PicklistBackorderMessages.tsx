import PicklistSelectionBackorderMessage from '@/components/PicklistSelectionBackorderMessage';
import type { ProductSearch } from '@/shared/service/b2b/graphql/product';
import type { PicklistSelection } from '@/utils/catalogBackorderDisplay';

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
      {selections.map((selection) => (
        <PicklistSelectionBackorderMessage
          key={selection.modifierId}
          selection={selection}
          product={picklistProductsById[selection.productId]}
          qty={qty}
        />
      ))}
    </>
  );
}

export default PicklistBackorderMessages;
