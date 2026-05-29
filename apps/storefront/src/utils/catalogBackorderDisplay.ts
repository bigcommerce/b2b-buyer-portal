import type { CatalogQuickVariantSku } from '@/shared/service/b2b/graphql/product';
import type { Variant } from '@/types/products';
import type { ShoppingListProductItem } from '@/types/shoppingList';
import type { BackorderDisplayFields } from '@/utils/backorderDisplayFromInventory';
import { getBackorderDisplayFieldsFromOnHand } from '@/utils/backorderDisplayFromInventory';

type SearchProductInventorySource = Pick<
  ShoppingListProductItem,
  | 'inventoryTracking'
  | 'availableToSell'
  | 'unlimitedBackorder'
  | 'totalOnHand'
  | 'backorderMessage'
>;

export function getCatalogInventoryRowFromSearchProduct(
  product: SearchProductInventorySource,
  variant?: Partial<Variant> | null,
): CatalogQuickVariantSku | undefined {
  const tracking = product.inventoryTracking || 'none';
  if (tracking !== 'product' && tracking !== 'variant') return undefined;

  if (tracking === 'product') {
    return {
      inventoryTracking: tracking,
      availableToSell: product.availableToSell ?? 0,
      unlimitedBackorder: product.unlimitedBackorder ?? false,
      totalOnHand: product.totalOnHand,
      backorderMessage: product.backorderMessage,
    };
  }

  if (!variant) return undefined;

  return {
    inventoryTracking: tracking,
    availableToSell: variant.available_to_sell ?? 0,
    unlimitedBackorder: variant.unlimited_backorder ?? false,
    totalOnHand: variant.total_on_hand,
    backorderMessage: variant.backorder_message,
  };
}

export function quantityExceedsAvailableToSell(
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

export function getCatalogBackorderDisplayQuantity(
  quantity: number,
  row: CatalogQuickVariantSku | undefined,
): number {
  if (!row) return quantity;
  if (quantity <= 0) return quantity;
  if (!quantityExceedsAvailableToSell(quantity, row)) return quantity;

  return Math.min(quantity, row.availableToSell ?? 0);
}

export function getCatalogBackorderDisplayFields(
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

export function getCatalogBackorderFieldsForVariantSku({
  quantity,
  variantSku,
  inventoryBySku,
}: {
  quantity: number;
  variantSku?: string | null;
  inventoryBySku: Record<string, CatalogQuickVariantSku>;
}): BackorderDisplayFields | null {
  if (!variantSku) return null;

  const catalogVariant = inventoryBySku[variantSku.toUpperCase()];

  return getCatalogBackorderDisplayFields(
    getCatalogBackorderDisplayQuantity(quantity, catalogVariant),
    catalogVariant,
  );
}

interface CatalogProductRowDisplayState {
  qtyHelperText: string;
  backorderFields: BackorderDisplayFields | null;
}

export function getCatalogProductRowDisplayState({
  qty,
  productHelperText,
  showAvailableToSellHelper,
  inventoryRow,
  backorderUiEnabled,
  formatOnlyAvailable,
}: {
  qty: number;
  productHelperText?: string;
  showAvailableToSellHelper: boolean;
  inventoryRow?: CatalogQuickVariantSku;
  backorderUiEnabled: boolean;
  formatOnlyAvailable: (availableToSell: number) => string;
}): CatalogProductRowDisplayState {
  const exceedsAvailableToSell =
    showAvailableToSellHelper &&
    Boolean(inventoryRow) &&
    quantityExceedsAvailableToSell(qty, inventoryRow);

  const availableToSellHelperText = exceedsAvailableToSell
    ? formatOnlyAvailable(inventoryRow?.availableToSell ?? 0)
    : '';

  const qtyHelperText = productHelperText?.trim() ? productHelperText : availableToSellHelperText;

  const backorderFields = backorderUiEnabled
    ? getCatalogBackorderDisplayFields(
        getCatalogBackorderDisplayQuantity(qty, inventoryRow),
        inventoryRow,
      )
    : null;

  return { qtyHelperText, backorderFields };
}
