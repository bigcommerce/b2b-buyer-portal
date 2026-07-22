import { OrderProductItem } from '@/types';

export function getRemainingBackorderedQuantity(product: OrderProductItem): number {
  const { quantityBackordered = 0, quantity = 0, quantity_shipped: quantityShipped = 0 } = product;
  const remainingUnshipped = Math.max(0, quantity - quantityShipped);

  return Math.min(quantityBackordered, remainingUnshipped);
}
