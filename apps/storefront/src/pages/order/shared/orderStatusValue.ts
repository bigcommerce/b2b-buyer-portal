/**
 * SF GQL returns `status { value, label }` where `value` is the stable
 * `OrderStatusValue` enum and `label` is a merchant-configurable display string.
 *
 * Every status lookup in this app — the colour/text tables in `getOrderStatus`, the
 * `systemLabel` match against the legacy `orderStatuses` query — is keyed by the
 * title-case system label. The live resolver returns `label` in sentence case
 * ("Awaiting fulfillment"), so mapping `label` straight to a lookup key silently
 * misses. Derive the key from `value` instead.
 *
 * Listed explicitly rather than title-cased algorithmically: this is the wire
 * contract, all 15 members are asserted against the lookup tables in the tests, and
 * a future member with an acronym would break a naive transform.
 */
export const ORDER_STATUS_SYSTEM_LABELS = {
  AWAITING_FULFILLMENT: 'Awaiting Fulfillment',
  AWAITING_PAYMENT: 'Awaiting Payment',
  AWAITING_PICKUP: 'Awaiting Pickup',
  AWAITING_SHIPMENT: 'Awaiting Shipment',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
  DECLINED: 'Declined',
  DISPUTED: 'Disputed',
  INCOMPLETE: 'Incomplete',
  MANUAL_VERIFICATION_REQUIRED: 'Manual Verification Required',
  PARTIALLY_REFUNDED: 'Partially Refunded',
  PARTIALLY_SHIPPED: 'Partially Shipped',
  PENDING: 'Pending',
  REFUNDED: 'Refunded',
  SHIPPED: 'Shipped',
} as const;

type OrderStatusValueKey = keyof typeof ORDER_STATUS_SYSTEM_LABELS;

const SYSTEM_LABEL_TO_VALUE: Record<string, string> = Object.fromEntries(
  Object.entries(ORDER_STATUS_SYSTEM_LABELS).map(([value, systemLabel]) => [systemLabel, value]),
);

/** Enum member -> title-case system label. Empty string when unrecognised. */
export const orderStatusValueToSystemLabel = (value: string | null | undefined): string =>
  (value && ORDER_STATUS_SYSTEM_LABELS[value as OrderStatusValueKey]) || '';

/** Title-case system label -> enum member. Undefined when unrecognised. */
export const systemLabelToOrderStatusValue = (systemLabel: string): string | undefined =>
  SYSTEM_LABEL_TO_VALUE[systemLabel];

/** Numeric code the legacy `orderStatuses` query reports as `statusCode`. */
export const ORDER_STATUS_LEGACY_CODES: Record<keyof typeof ORDER_STATUS_SYSTEM_LABELS, string> = {
  INCOMPLETE: '0',
  PENDING: '1',
  SHIPPED: '2',
  PARTIALLY_SHIPPED: '3',
  REFUNDED: '4',
  CANCELLED: '5',
  DECLINED: '6',
  AWAITING_PAYMENT: '7',
  AWAITING_PICKUP: '8',
  AWAITING_SHIPMENT: '9',
  COMPLETED: '10',
  AWAITING_FULFILLMENT: '11',
  MANUAL_VERIFICATION_REQUIRED: '12',
  DISPUTED: '13',
  PARTIALLY_REFUNDED: '14',
};
