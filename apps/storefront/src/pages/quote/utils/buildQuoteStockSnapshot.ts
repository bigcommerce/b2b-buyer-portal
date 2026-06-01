import type { QuoteStockSnapshotItem } from './detectQuoteStockChange';

interface SnapshotInput {
  id?: number | string;
  productId: number | string;
  variantId: number;
  variantSku?: string;
  sku?: string;
  quantity: number | string;
  productsSearch?: {
    inventoryTracking?: string;
    totalOnHand?: number | null;
    variants?: Array<{
      sku?: string;
      total_on_hand?: number | null;
    }>;
  };
}

function resolveTracking(lineItem: SnapshotInput): QuoteStockSnapshotItem['inventoryTracking'] {
  if (!lineItem.productsSearch) {
    return 'unknown';
  }

  const tracking = lineItem.productsSearch.inventoryTracking;
  if (tracking === 'none') {
    return 'none';
  }
  if (tracking === 'product' || tracking === 'variant') {
    return tracking;
  }
  // Unexpected value (e.g. a future BC tracking mode) — fail safe by not comparing.
  return 'unknown';
}

function extractTotalOnHand(lineItem: SnapshotInput): number | null {
  const search = lineItem.productsSearch;
  if (!search) {
    return null;
  }

  const tracking = search.inventoryTracking;
  if (tracking === 'product') {
    return search.totalOnHand ?? null;
  }

  if (tracking === 'variant') {
    const lookupSku = lineItem.variantSku || lineItem.sku;
    const variant = (search.variants || []).find((v) => v.sku === lookupSku);

    return variant?.total_on_hand ?? null;
  }

  return null;
}

export function buildQuoteStockSnapshot(lineItems: SnapshotInput[]): QuoteStockSnapshotItem[] {
  return lineItems.map((lineItem, index) => ({
    lineId: lineItem.id ?? `${lineItem.variantId}::${index}`,
    productId: Number(lineItem.productId),
    variantId: lineItem.variantId,
    variantSku: lineItem.variantSku || lineItem.sku,
    quantity: Number(lineItem.quantity ?? 0),
    inventoryTracking: resolveTracking(lineItem),
    totalOnHand: extractTotalOnHand(lineItem),
  }));
}
