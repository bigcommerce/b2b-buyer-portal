export interface QuoteStockSnapshotItem {
  lineId: number | string;
  productId: number;
  variantId: number;
  variantSku?: string;
  quantity: number;
  inventoryTracking: 'none' | 'product' | 'variant' | 'unknown';
  totalOnHand: number | null;
}

function computeFulfillableQuantity(quantity: number, totalOnHand: number): number {
  // Clamp at 0 so oversold stock (negative totalOnHand) doesn't produce a negative fulfillable
  // quantity — every negative value collapses to "nothing shippable" instead of comparing as distinct.
  return Math.max(0, Math.min(quantity, totalOnHand));
}

export function detectQuoteStockChange(
  previousSnapshot: QuoteStockSnapshotItem[],
  currentSnapshot: QuoteStockSnapshotItem[],
): boolean {
  const currentItemsByLineId = new Map<number | string, QuoteStockSnapshotItem>();
  currentSnapshot.forEach((p) => currentItemsByLineId.set(p.lineId, p));

  return previousSnapshot.some((previousItem) => {
    if (previousItem.inventoryTracking === 'none' || previousItem.inventoryTracking === 'unknown') {
      return false;
    }

    const currentItem = currentItemsByLineId.get(previousItem.lineId);
    if (!currentItem) {
      return false;
    }

    // For tracked items, a null totalOnHand means the stock lookup didn't resolve.
    if (previousItem.totalOnHand === null || currentItem.totalOnHand === null) {
      return false;
    }

    const previousFulfillable = computeFulfillableQuantity(
      previousItem.quantity,
      previousItem.totalOnHand,
    );
    const currentFulfillable = computeFulfillableQuantity(
      currentItem.quantity,
      currentItem.totalOnHand,
    );

    return previousFulfillable !== currentFulfillable;
  });
}
