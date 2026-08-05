import getOrderStatus, { orderStatusTranslationVariables } from './getOrderStatus';
import {
  ORDER_STATUS_SYSTEM_LABELS,
  orderStatusValueToSystemLabel,
  systemLabelToOrderStatusValue,
} from './orderStatusValue';

describe('orderStatusValue', () => {
  // The live resolver returns a lowercase-f label ("Awaiting fulfillment") while every
  // lookup table in the app is keyed in title case. Keying off the enum is what stops
  // a one-character casing change from blanking the status column.
  it('maps every OrderStatusValue member onto a key the status lookup tables recognise', () => {
    const values = Object.keys(ORDER_STATUS_SYSTEM_LABELS);

    expect(values).toHaveLength(15);

    values.forEach((value) => {
      const systemLabel = orderStatusValueToSystemLabel(value);
      const status = getOrderStatus(systemLabel);

      expect(status.color, `no color for ${value}`).toBeTruthy();
      expect(status.textColor, `no textColor for ${value}`).toBeTruthy();
      expect(status.name, `no name for ${value}`).toBeTruthy();
      expect(orderStatusTranslationVariables[systemLabel], `no i18n key for ${value}`).toBeTruthy();
    });
  });

  it('converts a multi-word enum member to its title-case system label', () => {
    expect(orderStatusValueToSystemLabel('AWAITING_FULFILLMENT')).toBe('Awaiting Fulfillment');
    expect(orderStatusValueToSystemLabel('MANUAL_VERIFICATION_REQUIRED')).toBe(
      'Manual Verification Required',
    );
  });

  // An unmatched status must render nothing rather than a mislabelled tag, which is
  // what OrderStatus already does when `name` is falsy.
  it('returns an empty string for an unknown or absent value', () => {
    expect(orderStatusValueToSystemLabel('NOT_A_STATUS')).toBe('');
    expect(orderStatusValueToSystemLabel(null)).toBe('');
    expect(orderStatusValueToSystemLabel(undefined)).toBe('');
  });

  it('converts a system label back to the enum member for filtering', () => {
    expect(systemLabelToOrderStatusValue('Awaiting Fulfillment')).toBe('AWAITING_FULFILLMENT');
    expect(systemLabelToOrderStatusValue('Shipped')).toBe('SHIPPED');
  });

  // The status filter drops on miss rather than sending a display string into an
  // enum-typed argument, which the server rejects at variable coercion.
  it('returns undefined when a system label has no enum member', () => {
    expect(systemLabelToOrderStatusValue('Awaiting fulfillment')).toBeUndefined();
    expect(systemLabelToOrderStatusValue('Backordered')).toBeUndefined();
  });
});
