interface OrderStatusConfig {
  [k: string]: string;
}

export const orderStatusCode: OrderStatusConfig = {
  0: 'Incomplete',
  1: 'Pending',
  2: 'Shipped',
  3: 'Partially Shipped',
  4: 'Refunded',
  5: 'Cancelled',
  6: 'Declined',
  7: 'Awaiting Payment',
  8: 'Awaiting Pickup',
  9: 'Awaiting Shipment',
  10: 'Completed',
  11: 'Awaiting Fulfillment',
  12: 'Manual Verification Required',
  13: 'Disputed',
  14: 'Partially Refunded',
};

const orderStatusColor: OrderStatusConfig = {
  'Partially Refunded': '#F4CC46',
  'Manual Verification Required': '#DDA3AE',
  Disputed: '#916CF6',
  Refunded: '#F4CC46',
  Declined: '#7A6041',
  Cancelled: '#000000',
  Shipped: '#C4DD6C',
  Completed: '#C4DD6C',
  'Partially Shipped': '#516FAE',
  'Awaiting Pickup': '#BE7FEB',
  'Awaiting Shipment': '#BD3E1E',
  'Awaiting Fulfillment': '#87CBF6',
  'Awaiting Payment': '#F19536',
  Pending: '#899193',
  Incomplete: '#000000',
};

const orderStatusTextColor: OrderStatusConfig = {
  'Partially Refunded': 'rgba(0, 0, 0, 0.87)',
  'Manual Verification Required': 'rgba(0, 0, 0, 0.87)',
  Disputed: '#FFFFFF',
  Refunded: 'rgba(0, 0, 0, 0.87)',
  Declined: '#FFFFFF',
  Cancelled: '#FFFFFF',
  Shipped: 'rgba(0, 0, 0, 0.87)',
  Completed: 'rgba(0, 0, 0, 0.87)',
  'Partially Shipped': '#FFFFFF',
  'Awaiting Pickup': '#FFFFFF',
  'Awaiting Shipment': '#FFFFFF',
  'Awaiting Fulfillment': 'rgba(0, 0, 0, 0.87)',
  'Awaiting Payment': '#FFFFFF',
  Pending: '#FFFFFF',
  Incomplete: '#FFFFFF',
};

// i18n
const orderStatusText: OrderStatusConfig = {
  'Partially Refunded': 'Partially Refunded',
  'Manual Verification Required': 'Manual Verification Required here',
  Disputed: 'Disputed',
  Refunded: 'Refunded',
  Declined: 'Declined',
  Cancelled: 'Cancelled',
  Shipped: 'Shipped',
  Completed: 'Completed',
  'Partially Shipped': 'Partially Shipped',
  'Awaiting Pickup': 'Awaiting Pickup',
  'Awaiting Shipment': 'Awaiting Shipment',
  'Awaiting Fulfillment': 'Awaiting Fulfillment',
  'Awaiting Payment': 'Awaiting Payment',
  Pending: 'Pending',
  Incomplete: 'Incomplete',
};

export const orderStatusTranslationVariables: OrderStatusConfig = {
  Incomplete: 'orders.status.incomplete',
  Pending: 'orders.status.pending',
  Shipped: 'orders.status.shipped',
  'Partially Shipped': 'orders.status.partiallyShipped',
  Refunded: 'orders.status.refunded',
  Cancelled: 'orders.status.cancelled',
  Declined: 'orders.status.declined',
  'Awaiting Payment': 'orders.status.awaitingPayment',
  'Awaiting Pickup': 'orders.status.awaitingPickup',
  'Awaiting Shipment': 'orders.status.awaitingShipment',
  Completed: 'orders.status.completed',
  'Awaiting Fulfillment': 'orders.status.awaitingFulfillment',
  'Manual Verification Required': 'orders.status.manualVerificationRequired',
  Disputed: 'orders.status.disputed',
  'Partially Refunded': 'orders.status.partiallyRefunded',
};

const getOrderStatus = (code: string | number) => ({
  color: orderStatusColor[code],
  textColor: orderStatusTextColor[code],
  name: orderStatusText[code],
});

export default getOrderStatus;
