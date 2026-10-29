import { OrderStatusItem } from '@/types';

/**
 * Resolves a selected filter value to its order status. An exact `systemLabel` match wins,
 * so a merchant custom label that equals another status's system label (e.g. Shipped
 * renamed to "Completed") cannot shadow that status.
 */
export const findOrderStatus = (
  orderStatuses: OrderStatusItem[],
  selected: string,
): OrderStatusItem | undefined =>
  orderStatuses.find((status) => status.systemLabel === selected) ??
  orderStatuses.find((status) => status.customLabel === selected);
