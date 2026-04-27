import type { Variant } from '@/types/products';
import { QuoteItem } from '@/types/quotes';

type QuoteItemBackendAvailability = {
  exceedsAvailableToSell: boolean;
  availableToSell: number;
};

export function getQuoteItemBackendAvailability(
  row: QuoteItem['node'],
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
  const exceedsAvailableToSell = !hasUnlimitedBackorder && availableToSell < qty;

  return { exceedsAvailableToSell, availableToSell };
}

export function draftRowQuantityExceedsAvailableToSell(row: QuoteItem['node']): boolean {
  return getQuoteItemBackendAvailability(row)?.exceedsAvailableToSell ?? false;
}

interface DraftBackorderDisplayFields {
  totalOnHand: number;
  backorderMessage?: string;
  quantityBackordered: number;
}

type DraftBackorderTracking = 'product' | 'variant';

function getDraftBackorderTracking(row: QuoteItem['node']): DraftBackorderTracking | null {
  const product = row.productsSearch;
  const tracking = (product.inventoryTracking as string) || 'none';
  if (tracking !== 'product' && tracking !== 'variant') return null;
  return tracking;
}

function findDraftQuoteVariant(row: QuoteItem['node']): Variant | undefined {
  return row.productsSearch.variants?.find(({ sku }) => sku === row.variantSku);
}

function getDraftBackorderTotalOnHand(
  row: QuoteItem['node'],
  tracking: DraftBackorderTracking,
): number | null {
  const product = row.productsSearch;
  if (tracking === 'product') {
    return product.totalOnHand ?? 0;
  }
  const variant = findDraftQuoteVariant(row);
  if (!variant) return null;
  return variant.total_on_hand ?? 0;
}

function getDraftBackorderBackorderMessage(
  row: QuoteItem['node'],
  tracking: DraftBackorderTracking,
): string | undefined {
  const product = row.productsSearch;
  if (tracking === 'product') {
    return product.backorderMessage ?? undefined;
  }
  const variant = findDraftQuoteVariant(row);
  if (!variant) return undefined;
  return variant.backorder_message ?? undefined;
}

function getDraftBackorderQuantityBackordered(
  orderedQuantity: number,
  totalOnHand: number,
): number {
  return Math.max(0, orderedQuantity - totalOnHand);
}

export function getDraftBackorderDisplayFields(
  row: QuoteItem['node'],
): DraftBackorderDisplayFields | null {
  const tracking = getDraftBackorderTracking(row);
  if (!tracking) return null;

  const totalOnHand = getDraftBackorderTotalOnHand(row, tracking);
  if (totalOnHand === null) return null;

  const backorderMessage = getDraftBackorderBackorderMessage(row, tracking);
  const qty = Number(row.quantity ?? 0);
  const quantityBackordered = getDraftBackorderQuantityBackordered(qty, totalOnHand);

  if (quantityBackordered <= 0) return null;

  return {
    totalOnHand,
    backorderMessage,
    quantityBackordered,
  };
}

export function draftQuoteListHasBackorderedItemsForDisplay(draftQuoteList: QuoteItem[]): boolean {
  return draftQuoteList.some((quoteItem) => {
    const fields = getDraftBackorderDisplayFields(quoteItem.node);
    if (!fields) return false;
    return !draftRowQuantityExceedsAvailableToSell(quoteItem.node);
  });
}
