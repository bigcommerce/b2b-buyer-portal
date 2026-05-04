import type { Order } from '@/shared/service/bc/graphql/orders';

import type { OrderDetailsState } from '../context/OrderDetailsContext';

export function convertOrderDetail(
  order: Order,
): Pick<OrderDetailsState, 'orderId' | 'status' | 'customStatus' | 'poNumber'> {
  return {
    orderId: order.entityId,

    // status.label matches the format the legacy API returns (e.g. "Pending").
    // getOrderStatusLabel() will look this up against the still-legacy
    // orderStatus list (getOrderStatusType / getBcOrderStatusType) to resolve
    // custom labels — same gap tracked in B2B-4614.
    status: order.status.label,

    // customStatus is not yet exposed by the unified endpoint.
    // getOrderStatusLabel() falls back to the status label when this is empty.
    customStatus: '',

    poNumber: order.reference ?? '',
  };
}
