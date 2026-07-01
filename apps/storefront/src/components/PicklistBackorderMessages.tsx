import PicklistSelectionBackorderMessage from '@/components/PicklistSelectionBackorderMessage';
import type { ProductSearch } from '@/shared/service/b2b/graphql/product';
import {
  getPicklistSnapshotBackorderFields,
  type PicklistBackorderSnapshotChild,
  type PicklistSelection,
} from '@/utils/catalogBackorderDisplay';

interface PicklistBackorderMessagesProps {
  selections: PicklistSelection[];
  picklistProductsById: Record<number, ProductSearch>;
  qty: number;
  visible: boolean;
  backorderUiEnabled: boolean;
  snapshotByProductId?: Record<number, PicklistBackorderSnapshotChild>;
}

function PicklistBackorderMessages({
  selections,
  picklistProductsById,
  qty,
  visible,
  backorderUiEnabled,
  snapshotByProductId,
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
          backorderFields={
            snapshotByProductId
              ? getPicklistSnapshotBackorderFields(snapshotByProductId[selection.productId])
              : undefined
          }
        />
      ))}
    </>
  );
}

export default PicklistBackorderMessages;
