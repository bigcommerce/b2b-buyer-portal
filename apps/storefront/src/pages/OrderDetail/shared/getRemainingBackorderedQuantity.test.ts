import { builder } from 'tests/test-utils';

import { OrderProductItem } from '@/types';

import { getRemainingBackorderedQuantity } from './getRemainingBackorderedQuantity';

const buildProductWith = builder<OrderProductItem>(() => ({
  base_price: '10.00',
  base_total: '10.00',
  brand: '',
  configurable_fields: '',
  cost_price_ex_tax: '0',
  cost_price_inc_tax: '0',
  cost_price_tax: '0',
  id: 1,
  imageUrl: '',
  is_bundled_product: false,
  is_refunded: false,
  name: 'Product',
  name_customer: 'Product',
  name_merchant: 'Product',
  optionList: [],
  option_set_id: 0,
  order_address_id: 1,
  order_id: 1,
  parent_order_product_id: 0,
  price_ex_tax: '10.00',
  price_inc_tax: '10.00',
  price_tax: '0',
  product_id: 1,
  product_options: [],
  quantity: 5,
  quantity_refunded: 0,
  quantity_shipped: 0,
  refund_amount: '0',
  return_id: 0,
  sku: 'SKU-1',
  total_ex_tax: '10.00',
  total_inc_tax: '10.00',
  total_tax: '0',
  type: 'physical',
  variant_id: 1,
  wrapping_cost_ex_tax: '0',
  wrapping_cost_inc_tax: '0',
  wrapping_cost_tax: '0',
  wrapping_id: 0,
  wrapping_message: '',
  wrapping_name: '',
}));

describe('getRemainingBackorderedQuantity', () => {
  it('returns the full backordered quantity when nothing has been shipped', () => {
    const product = buildProductWith({ quantity: 5, quantity_shipped: 0, quantityBackordered: 2 });

    expect(getRemainingBackorderedQuantity(product)).toBe(2);
  });

  it('still returns the full backordered quantity while shipped units are within the ready-to-ship portion', () => {
    const product = buildProductWith({ quantity: 5, quantity_shipped: 3, quantityBackordered: 2 });

    expect(getRemainingBackorderedQuantity(product)).toBe(2);
  });

  it('reduces the remaining count once shipped units cut into the backordered pool', () => {
    const product = buildProductWith({ quantity: 4, quantity_shipped: 2, quantityBackordered: 3 });

    expect(getRemainingBackorderedQuantity(product)).toBe(2);
  });

  it('returns 0 once the line is fully shipped', () => {
    const product = buildProductWith({ quantity: 5, quantity_shipped: 5, quantityBackordered: 2 });

    expect(getRemainingBackorderedQuantity(product)).toBe(0);
  });

  it('does not go negative when shipped exceeds the ordered quantity', () => {
    const product = buildProductWith({ quantity: 5, quantity_shipped: 7, quantityBackordered: 2 });

    expect(getRemainingBackorderedQuantity(product)).toBe(0);
  });

  it('returns 0 when there is no backordered quantity at all', () => {
    const product = buildProductWith({ quantity: 5, quantity_shipped: 0, quantityBackordered: 0 });

    expect(getRemainingBackorderedQuantity(product)).toBe(0);
  });

  it('defaults to 0 when quantityBackordered is undefined', () => {
    const product = buildProductWith({
      quantity: 5,
      quantity_shipped: 0,
      quantityBackordered: undefined,
    });

    expect(getRemainingBackorderedQuantity(product)).toBe(0);
  });
});
