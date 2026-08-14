import getOrderStatus, { orderStatusTranslationVariables } from './getOrderStatus';
import {
  ORDER_STATUS_SYSTEM_LABELS,
  orderStatusValueToSystemLabel,
  systemLabelToOrderStatusValue,
} from './orderStatusValue';

describe('orderStatusValue', () => {
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

  it('returns an empty string for an unknown or absent value', () => {
    expect(orderStatusValueToSystemLabel('NOT_A_STATUS')).toBe('');
    expect(orderStatusValueToSystemLabel(null)).toBe('');
    expect(orderStatusValueToSystemLabel(undefined)).toBe('');
  });

  it('converts a system label back to the enum member for filtering', () => {
    expect(systemLabelToOrderStatusValue('Awaiting Fulfillment')).toBe('AWAITING_FULFILLMENT');
    expect(systemLabelToOrderStatusValue('Shipped')).toBe('SHIPPED');
  });

  it('returns undefined when a system label has no enum member', () => {
    expect(systemLabelToOrderStatusValue('Awaiting fulfillment')).toBeUndefined();
    expect(systemLabelToOrderStatusValue('Backordered')).toBeUndefined();
  });
});
