import { QuoteStatus } from '@/shared/service/b2b/graphql/quote';

export type OrderSnapshotProduct = {
  productId: number;
  sku: string;
  totalOnHand: number | null;
  quantityBackordered: number;
  backorderMessage: string | null;
};

type BackorderFields = {
  totalOnHand?: number;
  quantityBackordered?: number;
  backorderMessage?: string;
};

function getSkuFromLineItem(item: { sku?: string; variantSku?: string }): string {
  return String(item.sku ?? item.variantSku ?? '').trim();
}

function buildLineItemKey(productId: number | string, sku: string): string {
  return `${Number(productId)}|${sku}`;
}

export function applyOrderedQuoteBackorderSnapshot<
  T extends { productId: number | string } & Partial<{ sku: string; variantSku: string }> &
    BackorderFields,
>(
  items: T[],
  orderSnapshot: { products: OrderSnapshotProduct[] } | null | undefined,
  status: number | string,
): T[] {
  if (Number(status) !== QuoteStatus.ORDERED) {
    return items;
  }

  if (!orderSnapshot?.products?.length) {
    return items.map((item) => ({
      ...item,
      totalOnHand: undefined,
      quantityBackordered: undefined,
      backorderMessage: undefined,
    }));
  }

  const snapshotQueuesByLineItemKey = new Map<
    string,
    { rows: OrderSnapshotProduct[]; nextRowIndex: number }
  >();
  orderSnapshot.products.forEach((snapshotProduct) => {
    const lineItemKey = buildLineItemKey(
      snapshotProduct.productId,
      String(snapshotProduct.sku ?? '').trim(),
    );
    const queueForLineItemKey = snapshotQueuesByLineItemKey.get(lineItemKey) ?? {
      rows: [],
      nextRowIndex: 0,
    };
    queueForLineItemKey.rows.push(snapshotProduct);
    snapshotQueuesByLineItemKey.set(lineItemKey, queueForLineItemKey);
  });

  return items.map((lineItem) => {
    const lineItemKey = buildLineItemKey(lineItem.productId, getSkuFromLineItem(lineItem));
    const snapshotQueue = snapshotQueuesByLineItemKey.get(lineItemKey);
    if (!snapshotQueue || snapshotQueue.nextRowIndex >= snapshotQueue.rows.length) {
      return {
        ...lineItem,
        totalOnHand: undefined,
        quantityBackordered: undefined,
        backorderMessage: undefined,
      };
    }

    const matchedSnapshotRow = snapshotQueue.rows[snapshotQueue.nextRowIndex];
    snapshotQueue.nextRowIndex += 1;

    return {
      ...lineItem,
      totalOnHand: matchedSnapshotRow.totalOnHand ?? undefined,
      quantityBackordered: matchedSnapshotRow.quantityBackordered,
      backorderMessage: matchedSnapshotRow.backorderMessage ?? undefined,
    };
  });
}
