import type { Variant } from '@/types/products';
import { QuoteItem } from '@/types/quotes';
import type { BackorderDisplayFields } from '@/utils/backorderDisplayFromInventory';
import { getBackorderDisplayFieldsFromOnHand } from '@/utils/backorderDisplayFromInventory';

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
