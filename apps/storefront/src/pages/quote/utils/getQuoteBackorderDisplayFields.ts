import type { Variant } from '@/types/products';
import { QuoteItem } from '@/types/quotes';
import type { BackorderDisplayFields } from '@/utils/backorderDisplayFromInventory';
import { getBackorderDisplayFieldsFromOnHand } from '@/utils/backorderDisplayFromInventory';
import {
  getPicklistSnapshotBackorderFields,
  getProductDetailsForPicklistSelections,
  type PicklistBackorderSnapshotChild,
  type PicklistSelection,
  type PicklistSelectionSource,
} from '@/utils/catalogBackorderDisplay';

export interface QuoteBackorderRow {
  quantity: number | string;
  variantSku?: string;
  totalOnHand?: number | null;
  backorderMessage?: string | null;
  quantityBackordered?: number | null;
  productsSearch: {
    inventoryTracking?: string;
    availableToSell?: number;
    unlimitedBackorder?: boolean;
    totalOnHand?: number | null;
    backorderMessage?: string | null;
    variants?: Variant[];
  };
}

type QuoteItemBackendAvailability = {
  exceedsAvailableToSell: boolean;
  availableToSell: number;
};

type QuoteBackorderTracking = 'product' | 'variant';

export function getQuoteItemBackendAvailability(
  row: QuoteBackorderRow,
): QuoteItemBackendAvailability | null {
  const product = row.productsSearch;

  if (product.inventoryTracking === 'none') return null;

  let hasUnlimitedBackorder = Boolean(product.unlimitedBackorder);
  let { availableToSell } = product;

  if (product.inventoryTracking === 'variant' && product.variants) {
    const currentVariant = product.variants.find(({ sku }) => sku === row.variantSku);
    if (currentVariant) {
      hasUnlimitedBackorder = Boolean(currentVariant.unlimited_backorder);
      availableToSell = currentVariant.available_to_sell;
    }
  }

  const qty = Number(row.quantity ?? 0);
  if (availableToSell == null) return null;

  const exceedsAvailableToSell = !hasUnlimitedBackorder && availableToSell < qty;

  return { exceedsAvailableToSell, availableToSell };
}

export function getQuoteBackorderDisplayQuantity(row: QuoteBackorderRow): number {
  const qty = Number(row.quantity ?? 0);
  if (qty <= 0) return qty;

  const availability = getQuoteItemBackendAvailability(row);
  if (!availability?.exceedsAvailableToSell) return qty;

  return Math.min(qty, availability.availableToSell);
}

export function draftRowQuantityExceedsAvailableToSell(row: QuoteBackorderRow): boolean {
  return getQuoteItemBackendAvailability(row)?.exceedsAvailableToSell ?? false;
}

function getQuoteBackorderTracking(row: QuoteBackorderRow): QuoteBackorderTracking | null {
  const product = row.productsSearch;
  const tracking = (product.inventoryTracking as string) || 'none';
  if (tracking !== 'product' && tracking !== 'variant') return null;
  return tracking;
}

function findQuoteVariant(row: QuoteBackorderRow): Variant | undefined {
  return row.productsSearch.variants?.find(({ sku }) => sku === row.variantSku);
}

function getQuoteBackorderTotalOnHand(
  row: QuoteBackorderRow,
  tracking: QuoteBackorderTracking,
): number | null {
  if (row.totalOnHand != null) return row.totalOnHand;

  const product = row.productsSearch;
  if (tracking === 'product') {
    return product.totalOnHand ?? null;
  }
  const variant = findQuoteVariant(row);
  if (!variant) return null;
  return variant.total_on_hand ?? null;
}

function getQuoteBackorderBackorderMessage(
  row: QuoteBackorderRow,
  tracking: QuoteBackorderTracking,
): string | undefined {
  if (row.backorderMessage != null) return row.backorderMessage || undefined;

  const product = row.productsSearch;
  if (tracking === 'product') {
    return product.backorderMessage ?? undefined;
  }
  const variant = findQuoteVariant(row);
  if (!variant) return undefined;
  return variant.backorder_message ?? undefined;
}

function getQuoteBackorderDisplayFieldsFromApi(
  row: QuoteBackorderRow,
): BackorderDisplayFields | null {
  if ((row.quantityBackordered ?? 0) <= 0) return null;

  return {
    totalOnHand: row.totalOnHand ?? 0,
    quantityBackordered: row.quantityBackordered ?? 0,
    backorderMessage: row.backorderMessage ?? undefined,
  };
}

export function getQuoteBackorderDisplayFields(
  row: QuoteBackorderRow,
): BackorderDisplayFields | null {
  const tracking = getQuoteBackorderTracking(row);
  if (!tracking) {
    return getQuoteBackorderDisplayFieldsFromApi(row);
  }

  const totalOnHand = getQuoteBackorderTotalOnHand(row, tracking);
  if (totalOnHand === null) return getQuoteBackorderDisplayFieldsFromApi(row);

  const backorderMessage = getQuoteBackorderBackorderMessage(row, tracking);
  const displayQty = getQuoteBackorderDisplayQuantity(row);
  return getBackorderDisplayFieldsFromOnHand(displayQty, totalOnHand, backorderMessage);
}

export function getDraftBackorderDisplayFields(row: QuoteItem['node']) {
  return getQuoteBackorderDisplayFields(row);
}

interface QuoteOptionEntry {
  option_id?: number | string;
  optionId?: number | string;
  option_value?: number | string;
  optionValue?: number | string;
}

// The shared picklist resolver wants numeric {option_id, value_id} pairs. Normalise an id (a bare
// number or shaped like "attribute[123]") and a value into that pair, or null if unusable.
function toQuoteOptionSelection(
  rawId: number | string | undefined,
  rawValue: number | string | undefined,
): { option_id: number; value_id: number } | null {
  if (rawId == null || rawValue == null) {
    return null;
  }

  const idMatch = `${rawId}`.match(/\d+/);
  const optionId = idMatch ? Number(idMatch[0]) : Number.NaN;
  const valueId = Number(rawValue);
  if (Number.isNaN(optionId) || Number.isNaN(valueId)) {
    return null;
  }

  return { option_id: optionId, value_id: valueId };
}

function parseQuoteOptionListSelections(
  optionList: string | null | undefined,
): Array<{ option_id: number; value_id: number }> {
  if (!optionList) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(optionList);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return (parsed as unknown[]).flatMap((item) => {
    if (item === null || typeof item !== 'object') {
      return [];
    }

    const entry = item as QuoteOptionEntry;
    const selection = toQuoteOptionSelection(
      entry.option_id ?? entry.optionId,
      entry.option_value ?? entry.optionValue,
    );
    return selection ? [selection] : [];
  });
}

// Draft rows carry selections as `optionList` (a JSON string); saved/detail rows carry them as a
// structured `options` array. Both translate to the resolver's {option_id, value_id} shape.
export function getQuotePicklistSelections(row: {
  optionList?: string | null;
  options?: QuoteOptionEntry[] | null;
  productsSearch?: PicklistSelectionSource['productsSearch'];
}): PicklistSelection[] {
  const optionSelections = row.options?.length
    ? row.options.flatMap((option) => {
        const selection = toQuoteOptionSelection(option.optionId, option.optionValue);
        return selection ? [selection] : [];
      })
    : parseQuoteOptionListSelections(row.optionList);

  return getProductDetailsForPicklistSelections({
    optionSelections,
    productsSearch: row.productsSearch,
  });
}

export function draftQuoteListHasBackorderedItemsForDisplay(draftQuoteList: QuoteItem[]): boolean {
  return draftQuoteList.some((quoteItem) =>
    Boolean(getQuoteBackorderDisplayFields(quoteItem.node)),
  );
}

export function quoteDetailListHasBackorderedItemsForDisplay(
  productList: QuoteBackorderRow[],
): boolean {
  return productList.some((item) => Boolean(getQuoteBackorderDisplayFields(item)));
}

interface PicklistBackorderSnapshotRow {
  picklistBackorder?: PicklistBackorderSnapshotChild[] | null;
}

export function getRowPicklistBackorderSnapshot(
  row: PicklistBackorderSnapshotRow,
): Record<number, PicklistBackorderSnapshotChild> | undefined {
  const children = row.picklistBackorder;
  if (!children?.length) {
    return undefined;
  }

  const byProductId: Record<number, PicklistBackorderSnapshotChild> = {};
  children.forEach((child) => {
    if (child?.product_id != null) {
      byProductId[child.product_id] = child;
    }
  });
  return byProductId;
}

export function quoteDetailListHasPicklistSnapshotBackordered(
  productList: Array<
    Parameters<typeof getQuotePicklistSelections>[0] & PicklistBackorderSnapshotRow
  >,
): boolean {
  return productList.some((row) => {
    const snapshotByProductId = getRowPicklistBackorderSnapshot(row);
    if (!snapshotByProductId) {
      return false;
    }
    return getQuotePicklistSelections(row).some(
      (selection) =>
        getPicklistSnapshotBackorderFields(snapshotByProductId[selection.productId]) !== null,
    );
  });
}
