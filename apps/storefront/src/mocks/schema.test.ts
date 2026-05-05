import { describe, expect, it } from 'vitest';

import { mockSchema } from './schema';

describe('mockSchema', () => {
  it('builds the canonical B2B schema with order extensions', () => {
    expect(mockSchema.getType('Order')).toBeDefined();
    expect(mockSchema.getType('OrdersSortInput')).toBeDefined();
    expect(mockSchema.getType('CompanyOrdersFiltersInput')).toBeDefined();
  });

  it('includes custom scalars from the canonical schema', () => {
    expect(mockSchema.getType('Date')).toBeDefined();
    expect(mockSchema.getType('Decimal')).toBeDefined();
    expect(mockSchema.getType('GenericScalar')).toBeDefined();
    expect(mockSchema.getType('ProductQuantity')).toBeDefined();
  });
});
