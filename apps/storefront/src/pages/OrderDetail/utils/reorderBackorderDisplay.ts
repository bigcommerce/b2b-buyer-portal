import type { CatalogQuickVariantSku } from '@/shared/service/b2b/graphql/product';
import type { BackorderDisplayFields } from '@/utils/backorderDisplayFromInventory';
import { getBackorderDisplayFieldsFromOnHand } from '@/utils/backorderDisplayFromInventory';

export function reorderQuantityExceedsAvailableToSell(
  quantity: number,
  row: CatalogQuickVariantSku | undefined,
): boolean {
  if (!row) return false;
  const tracking = row.inventoryTracking || 'none';
  if (tracking === 'none') return false;
  if (row.unlimitedBackorder) return false;
  const availableToSell = row.availableToSell ?? 0;

  return quantity > availableToSell;
}

export function getReorderBackorderDisplayQuantity(
  orderQty: number,
  row: CatalogQuickVariantSku | undefined,
): number {
  if (!row) return orderQty;
  if (orderQty <= 0) return orderQty;
  if (!reorderQuantityExceedsAvailableToSell(orderQty, row)) return orderQty;

  return Math.min(orderQty, row.availableToSell ?? 0);
}

export function getReorderBackorderDisplayFields(
  quantity: number,
  row: CatalogQuickVariantSku | undefined,
): BackorderDisplayFields | null {
  if (!row) return null;
  const tracking = row.inventoryTracking || 'none';
  if (tracking !== 'product' && tracking !== 'variant') return null;

  const { totalOnHand } = row;
  if (totalOnHand === null || totalOnHand === undefined) return null;

  return getBackorderDisplayFieldsFromOnHand(
    quantity,
    totalOnHand,
    row.backorderMessage ?? undefined,
  );
}

interface ReorderProductRowDisplayState {
  qtyHelperText: string;
  backorderFields: BackorderDisplayFields | null;
}

export function getReorderProductRowDisplayState({
  qty,
  productHelperText,
  isReorder,
  inventoryRow,
  backorderUiEnabled,
  formatOnlyAvailable,
}: {
  qty: number;
  productHelperText?: string;
  isReorder: boolean;
  inventoryRow?: CatalogQuickVariantSku;
  backorderUiEnabled: boolean;
  formatOnlyAvailable: (availableToSell: number) => string;
}): ReorderProductRowDisplayState {
  const quantityExceedsAvailableToSell =
    isReorder && Boolean(inventoryRow) && reorderQuantityExceedsAvailableToSell(qty, inventoryRow);

  const availableToSellHelperText = quantityExceedsAvailableToSell
    ? formatOnlyAvailable(inventoryRow?.availableToSell ?? 0)
    : '';

  const qtyHelperText = productHelperText?.trim() ? productHelperText : availableToSellHelperText;

  const backorderFields = backorderUiEnabled
    ? getReorderBackorderDisplayFields(
        getReorderBackorderDisplayQuantity(qty, inventoryRow),
        inventoryRow,
      )
    : null;

  return { qtyHelperText, backorderFields };
}
