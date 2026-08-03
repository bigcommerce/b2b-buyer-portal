import { builder } from 'tests/test-utils';

import type { CatalogQuickVariantSku } from '@/shared/service/b2b/graphql/product';
import { OrderProductItem, OrderProductOption } from '@/types';

import { getOrderPicklistSelections } from './getOrderPicklistSelections';

const buildProductOptionWith = builder<OrderProductOption>(() => ({
  display_name: 'Bundle option',
  display_name_customer: 'Bundle option',
  display_name_merchant: 'Bundle option',
  display_style: '',
  display_value: 'Bundle child',
  display_value_customer: 'Bundle child',
  display_value_merchant: 'Bundle child',
  id: 1,
  name: 'Bundle option',
  option_id: 0,
  order_product_id: 0,
  product_option_id: 100,
  type: 'product_list',
  value: '200',
}));

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
  sku: 'BUNDLE-PARENT',
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

const picklistModifier = {
  id: 100,
  type: 'product_list',
  display_name: 'Bundle option',
  option_values: [{ id: 200, value_data: { product_id: 555 } }],
};

const buildInventoryBySku = (
  modifiers: unknown[],
  sku = 'BUNDLE-PARENT',
): Record<string, CatalogQuickVariantSku> => ({ [sku]: { modifiers } });

describe('getOrderPicklistSelections', () => {
  it('resolves a picklist selection from the product options and the parent modifier', () => {
    const product = buildProductWith({
      product_options: [buildProductOptionWith({ product_option_id: 100, value: '200' })],
    });
    const inventoryBySku = buildInventoryBySku([picklistModifier]);

    expect(getOrderPicklistSelections(product, inventoryBySku)).toEqual([
      { modifierId: 100, displayName: 'Bundle option', productId: 555 },
    ]);
  });

  it('matches the parent modifier row case-insensitively by sku', () => {
    const product = buildProductWith({
      sku: 'bundle-parent',
      product_options: [buildProductOptionWith({ product_option_id: 100, value: '200' })],
    });
    const inventoryBySku = buildInventoryBySku([picklistModifier], 'BUNDLE-PARENT');

    expect(getOrderPicklistSelections(product, inventoryBySku)).toEqual([
      { modifierId: 100, displayName: 'Bundle option', productId: 555 },
    ]);
  });

  it('returns an empty array when the product has no options', () => {
    const product = buildProductWith({ product_options: [] });
    const inventoryBySku = buildInventoryBySku([picklistModifier]);

    expect(getOrderPicklistSelections(product, inventoryBySku)).toEqual([]);
  });

  it('returns an empty array when the product sku has no catalog inventory row', () => {
    const product = buildProductWith({
      product_options: [buildProductOptionWith({ product_option_id: 100, value: '200' })],
    });

    expect(getOrderPicklistSelections(product, {})).toEqual([]);
  });

  it('returns an empty array when the referenced modifier is not a picklist', () => {
    const product = buildProductWith({
      product_options: [buildProductOptionWith({ product_option_id: 100, value: '200' })],
    });
    const inventoryBySku = buildInventoryBySku([{ ...picklistModifier, type: 'dropdown' }]);

    expect(getOrderPicklistSelections(product, inventoryBySku)).toEqual([]);
  });

  it('resolves selections across multiple picklist modifiers', () => {
    const secondModifier = {
      id: 101,
      type: 'product_list',
      display_name: 'Second option',
      option_values: [{ id: 201, value_data: { product_id: 556 } }],
    };
    const product = buildProductWith({
      product_options: [
        buildProductOptionWith({ product_option_id: 100, value: '200' }),
        buildProductOptionWith({ product_option_id: 101, value: '201' }),
      ],
    });
    const inventoryBySku = buildInventoryBySku([picklistModifier, secondModifier]);

    expect(getOrderPicklistSelections(product, inventoryBySku)).toEqual([
      { modifierId: 100, displayName: 'Bundle option', productId: 555 },
      { modifierId: 101, displayName: 'Second option', productId: 556 },
    ]);
  });
});
