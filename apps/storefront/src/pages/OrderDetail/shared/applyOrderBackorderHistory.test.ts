import { builder } from 'tests/test-utils';

import { OrderBackorderHistory } from '@/shared/service/bc/graphql/orders';
import {
  Address,
  CompanyInfoTypes,
  OrderProductItem,
  OrderShippedItem,
  OrderShippingsItem,
} from '@/types';

import { applyOrderBackorderHistory } from './applyOrderBackorderHistory';
import convertB2BOrderDetails from './B2BOrderData';

type ConvertedOrderData = ReturnType<typeof convertB2BOrderDetails>;

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

const buildAddressWith = builder<Address>(() => ({
  city: '',
  company: '',
  country: '',
  country_iso2: '',
  email: '',
  first_name: '',
  last_name: '',
  phone: '',
  state: '',
  street_1: '',
  street_2: '',
  zip: '',
}));

const buildShippedItemWith = builder<OrderShippedItem>(() => ({
  ...buildAddressWith('WHATEVER_VALUES'),
  billing_address: buildAddressWith('WHATEVER_VALUES'),
  comments: '',
  customer_id: 1,
  date_created: '',
  id: 1,
  items: [],
  merchant_shipping_cost: '0',
  order_address_id: 1,
  order_id: 1,
  shipping_address: buildAddressWith('WHATEVER_VALUES'),
  shipping_method: '',
  shipping_provider_display_name: '',
  tracking_carrier: '',
  tracking_link: '',
  tracking_number: '',
  itemsInfo: [],
}));

const buildShippingWith = builder<OrderShippingsItem>(() => ({
  ...buildAddressWith('WHATEVER_VALUES'),
  base_cost: '0',
  base_handling_cost: '0',
  cost_ex_tax: '0',
  cost_inc_tax: '0',
  cost_tax: '0',
  cost_tax_class_id: 0,
  handling_cost_ex_tax: '0',
  handling_cost_inc_tax: '0',
  handling_cost_tax: '0',
  handling_cost_tax_class_id: 0,
  id: 1,
  items_shipped: 0,
  items_total: 0,
  order_id: 1,
  shipping_method: '',
  shipping_quotes: '',
  shipping_zone_id: 0,
  shipping_zone_name: '',
  shipmentItems: [],
  notShip: { itemsInfo: [] },
}));

const buildOrderDataWith = builder<ConvertedOrderData>(() => ({
  shippings: [],
  billings: [],
  digitalProducts: [],
  billingAddress: buildAddressWith('WHATEVER_VALUES'),
  history: [],
  poNumber: '',
  status: '',
  statusCode: 0,
  currencyCode: 'USD',
  currency: '$',
  money: {
    currency_location: 'left',
    currency_token: '$',
    decimal_token: '.',
    thousands_token: ',',
    decimal_places: 2,
    currency_exchange_rate: '1.0',
  },
  orderSummary: { createAt: '', name: '', priceData: {}, priceSymbol: {} },
  payment: {
    updatedAt: '',
    billingAddress: buildAddressWith('WHATEVER_VALUES'),
    paymentMethod: '',
    dateCreateAt: '',
  },
  orderComments: '',
  products: [],
  orderId: 1,
  customStatus: '',
  ipStatus: 0,
  invoiceId: 0,
  canReturn: false,
  createdEmail: '',
  orderIsDigital: false,
  companyInfo: {} as CompanyInfoTypes,
}));

const buildHistoryWith = builder<OrderBackorderHistory>(() => ({
  shippingExpectationMessage: undefined,
  lineItems: [],
}));

describe('applyOrderBackorderHistory', () => {
  it('returns the data unchanged (but explicitly clears any stale message) when there is no history', () => {
    const data = buildOrderDataWith({ products: [buildProductWith({ id: 1 })] });

    const result = applyOrderBackorderHistory(data, null);

    expect(result).toEqual(data);
    // Explicit undefined, not merely absent — the context reducer's shallow merge only clears a
    // stale message from a previously viewed order if the key is actually present in the payload.
    expect(Object.prototype.hasOwnProperty.call(result, 'shippingExpectationMessage')).toBe(true);
    expect(result.shippingExpectationMessage).toBeUndefined();
  });

  it('returns the data unchanged (but explicitly clears any stale message) when the history has no backordered line items, even if a shipping-expectation message is present', () => {
    const data = buildOrderDataWith({ products: [buildProductWith({ id: 1 })] });
    const history = buildHistoryWith({
      shippingExpectationMessage: 'Ships separately',
      lineItems: [],
    });

    const result = applyOrderBackorderHistory(data, history);

    expect(result).toEqual(data);
    expect(Object.prototype.hasOwnProperty.call(result, 'shippingExpectationMessage')).toBe(true);
    expect(result.shippingExpectationMessage).toBeUndefined();
  });

  it('clears a stale shipping-expectation message left in context state by a previously viewed order', () => {
    // OrderDetailsContext's reducer does `{ ...state, ...action.payload }` and stays mounted across
    // order-to-order navigation (same route, different :id) — so a message from a prior order with
    // backorders must be explicitly cleared here, not merely omitted, or it lingers for this one.
    const previousState = {
      shippingExpectationMessage: 'Ships separately (from a previous order)',
    };
    const data = buildOrderDataWith({ products: [buildProductWith({ id: 1 })] });

    const payload = applyOrderBackorderHistory(data, null);
    const nextState = { ...previousState, ...payload };

    expect(nextState.shippingExpectationMessage).toBeUndefined();
  });

  it('merges quantityBackordered/backorderMessage by entityId across products, digitalProducts, shipped and unshipped lines, leaving unmatched lines untouched', () => {
    const matchedProduct = buildProductWith({ id: 501, sku: 'PK' });
    const matchedDigitalProduct = buildProductWith({ id: 502, sku: 'DL', type: 'digital' });
    const matchedShippedProduct = buildProductWith({ id: 503, sku: 'SH' });
    const matchedUnshippedProduct = buildProductWith({ id: 504, sku: 'NS' });
    const unmatchedProduct = buildProductWith({ id: 999, sku: 'OTHER' });

    const data = buildOrderDataWith({
      products: [matchedProduct, unmatchedProduct],
      digitalProducts: [matchedDigitalProduct],
      shippings: [
        buildShippingWith({
          shipmentItems: [buildShippedItemWith({ itemsInfo: [matchedShippedProduct] })],
          notShip: { itemsInfo: [matchedUnshippedProduct] },
        }),
      ],
    });

    const history = buildHistoryWith({
      lineItems: [
        { entityId: 501, quantityBackordered: 1, backorderMessage: 'Backordered A' },
        { entityId: 502, quantityBackordered: 2, backorderMessage: 'Backordered B' },
        { entityId: 503, quantityBackordered: 3, backorderMessage: 'Backordered C' },
        { entityId: 504, quantityBackordered: 4, backorderMessage: 'Backordered D' },
      ],
    });

    const result = applyOrderBackorderHistory(data, history);

    expect(result.products[0]).toMatchObject({
      quantityBackordered: 1,
      backorderMessage: 'Backordered A',
    });
    expect(result.digitalProducts[0]).toMatchObject({
      quantityBackordered: 2,
      backorderMessage: 'Backordered B',
    });
    expect(result.shippings[0].shipmentItems[0].itemsInfo[0]).toMatchObject({
      quantityBackordered: 3,
      backorderMessage: 'Backordered C',
    });
    expect(result.shippings[0].notShip.itemsInfo[0]).toMatchObject({
      quantityBackordered: 4,
      backorderMessage: 'Backordered D',
    });

    expect(result.products[1].quantityBackordered).toBeUndefined();
  });

  it('sets the order-level shipping-expectation message when at least one line still has a remaining backorder', () => {
    const outstandingProduct = buildProductWith({ id: 1, quantity: 5, quantity_shipped: 0 });
    const data = buildOrderDataWith({
      products: [outstandingProduct],
      shippings: [buildShippingWith({ notShip: { itemsInfo: [outstandingProduct] } })],
    });
    const history = buildHistoryWith({
      shippingExpectationMessage: 'Ships separately',
      lineItems: [{ entityId: 1, quantityBackordered: 1, backorderMessage: null }],
    });

    const result = applyOrderBackorderHistory(data, history);

    expect(result.shippingExpectationMessage).toBe('Ships separately');
  });

  it('normalizes a null shipping-expectation message to undefined', () => {
    const outstandingProduct = buildProductWith({ id: 1, quantity: 5, quantity_shipped: 0 });
    const data = buildOrderDataWith({
      products: [outstandingProduct],
      shippings: [buildShippingWith({ notShip: { itemsInfo: [outstandingProduct] } })],
    });
    const history = buildHistoryWith({
      shippingExpectationMessage: null,
      lineItems: [{ entityId: 1, quantityBackordered: 1, backorderMessage: null }],
    });

    const result = applyOrderBackorderHistory(data, history);

    expect(result.shippingExpectationMessage).toBeUndefined();
  });

  it('drops the order-level shipping-expectation message when no more backordered items remain unshipped', () => {
    const fullyShippedProduct = buildProductWith({ id: 1, quantity: 5, quantity_shipped: 5 });
    const data = buildOrderDataWith({
      products: [fullyShippedProduct],
      shippings: [
        buildShippingWith({
          shipmentItems: [buildShippedItemWith({ itemsInfo: [fullyShippedProduct] })],
          notShip: { itemsInfo: [] },
        }),
      ],
    });
    const history = buildHistoryWith({
      shippingExpectationMessage: 'Ships separately',
      lineItems: [{ entityId: 1, quantityBackordered: 1, backorderMessage: null }],
    });

    const result = applyOrderBackorderHistory(data, history);

    expect(result.shippingExpectationMessage).toBeUndefined();
  });
});
