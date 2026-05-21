import type { LangFormatFunction } from '@/lib/lang';
import type {
  Order,
  OrderAddress,
  OrderDigitalLineItem,
  OrderLineItem,
} from '@/shared/service/bc/graphql/orders';
import { OrderHistoryEventType } from '@/shared/service/bc/graphql/orders';
import type {
  Address,
  CompanyInfoTypes,
  Currency,
  MoneyFormat,
  OrderBillings,
  OrderHistoryItem,
  OrderPayment,
  OrderProductItem,
  OrderShippingsItem,
  OrderSummary,
} from '@/types';

import type { OrderDetailsState } from '../context/OrderDetailsContext';

// ===========================================================================
// Shared helpers
// ===========================================================================

function buildMoneyFormat(currencies: Currency[], currencyCode: string): MoneyFormat {
  const currency = currencies.find((c) => c.currency_code === currencyCode);
  if (!currency) {
    return {
      currency_location: 'left',
      currency_token: '$',
      decimal_token: '.',
      decimal_places: 2,
      thousands_token: ',',
      currency_exchange_rate: '1.0000000000',
    };
  }
  return {
    currency_location: currency.token_location,
    currency_token: currency.token,
    decimal_token: currency.decimal_token,
    decimal_places: currency.decimal_places,
    thousands_token: currency.thousands_token,
    currency_exchange_rate: currency.currency_exchange_rate,
  };
}

function formatPrice(value: number, decimalPlaces: number): string {
  return value.toFixed(decimalPlaces);
}

// ===========================================================================
// Order summary (from B2B-4825)
// ===========================================================================

function buildOrderSummary(
  order: Order,
  b3Lang: LangFormatFunction,
  decimalPlaces: number,
): OrderSummary {
  const labels = {
    subTotal: b3Lang('orderDetail.summary.subTotal'),
    shipping: b3Lang('orderDetail.summary.shipping'),
    handlingFee: b3Lang('orderDetail.summary.handlingFee'),
    discountAmount: b3Lang('orderDetail.summary.discountAmount'),
    tax: b3Lang('orderDetail.summary.tax'),
    grandTotal: b3Lang('orderDetail.summary.grandTotal'),
  };

  const hasHandlingFee = order.handlingCostTotal.value > 0;

  const couponPrices: Record<string, string> = {};
  const couponSymbols: Record<string, string> = {};

  order.discounts.couponDiscounts.forEach((coupon) => {
    const key = b3Lang('orderDetail.summary.coupon', {
      couponCode: coupon.couponCode ? `(${coupon.couponCode})` : '',
    });
    couponPrices[key] = formatPrice(coupon.discountedAmount.value, decimalPlaces);
    couponSymbols[key] = 'coupon';
  });

  const placedByName = order.placedBy
    ? `${order.placedBy.firstName} ${order.placedBy.lastName}`.trim()
    : '';

  return {
    createAt: order.orderedAt.utc,
    name: placedByName,
    priceData: {
      [labels.subTotal]: formatPrice(order.subTotal.value, decimalPlaces),
      [labels.shipping]: formatPrice(order.shippingCostTotal.value, decimalPlaces),
      ...(hasHandlingFee && {
        [labels.handlingFee]: formatPrice(order.handlingCostTotal.value, decimalPlaces),
      }),
      [labels.discountAmount]: formatPrice(
        order.discounts.nonCouponDiscountTotal.value,
        decimalPlaces,
      ),
      ...couponPrices,
      [labels.tax]: formatPrice(order.taxTotal.value, decimalPlaces),
      [labels.grandTotal]: formatPrice(order.totalIncTax.value, decimalPlaces),
    },
    priceSymbol: {
      [labels.subTotal]: 'subTotal',
      [labels.shipping]: 'shipping',
      ...(hasHandlingFee && { [labels.handlingFee]: 'handlingFee' }),
      [labels.discountAmount]: 'discountAmount',
      ...couponSymbols,
      [labels.tax]: 'tax',
      [labels.grandTotal]: 'grandTotal',
    },
  };
}

// ===========================================================================
// History (from B2B-4825)
// ===========================================================================

function toNumericEventType(type: OrderHistoryEventType): number {
  switch (type) {
    case OrderHistoryEventType.ORDER_CREATED:
      return 1;
    case OrderHistoryEventType.ORDER_UPDATED:
      return 2;
    default:
      return 2;
  }
}

function mapHistoryEvents(history: Order['history']): OrderHistoryItem[] {
  return history.map((e) => ({
    id: Number(e.id),
    eventType: toNumericEventType(e.eventType),
    status: e.status,
    createdAt: Math.floor(new Date(e.createdAt).getTime() / 1000),
  }));
}

// ===========================================================================
// Address conversion (B2B-4826)
// ===========================================================================

function convertAddress(sfAddr: OrderAddress): Address {
  return {
    first_name: sfAddr.firstName ?? '',
    last_name: sfAddr.lastName ?? '',
    company: sfAddr.company ?? '',
    street_1: sfAddr.address1 ?? '',
    street_2: sfAddr.address2 ?? '',
    city: sfAddr.city ?? '',
    state: sfAddr.stateOrProvince ?? '',
    zip: sfAddr.postalCode ?? '',
    country: sfAddr.country ?? '',
    country_iso2: sfAddr.countryCode ?? '',
    phone: sfAddr.phone ?? '',
    email: sfAddr.email ?? '',
  };
}

// ===========================================================================
// Product conversion (B2B-4826)
// ===========================================================================

function convertLineItemToProduct(
  item: OrderLineItem,
  decimalPlaces: number,
  consignmentEntityId: number,
): OrderProductItem {
  const unitPrice = item.quantity > 0 ? item.subTotalListPrice.value / item.quantity : 0;
  const formattedUnitPrice = formatPrice(unitPrice, decimalPlaces);
  const formattedTotal = formatPrice(item.subTotalListPrice.value, decimalPlaces);

  return {
    id: item.entityId,
    product_id: item.productEntityId,
    variant_id: item.variantEntityId ?? 0,
    sku: item.sku ?? '',
    name: item.name,
    brand: item.brand ?? '',
    quantity: item.quantity,
    imageUrl: item.image?.url ?? '',
    type: 'physical',
    price_inc_tax: formattedUnitPrice,
    price_ex_tax: formattedUnitPrice,
    price_tax: '0',
    total_inc_tax: formattedTotal,
    total_ex_tax: formattedTotal,
    total_tax: '0',
    base_price: formattedUnitPrice,
    base_total: formattedTotal,
    quantity_shipped: 0,
    quantity_refunded: 0,
    refund_amount: '0',
    return_id: 0,
    optionList: item.productOptions.map((o) => ({
      optionId: 0,
      optionValue: o.value,
      type: o.name,
    })),
    product_options: [],
    order_address_id: consignmentEntityId,
    order_id: 0,
    parent_order_product_id: 0,
    option_set_id: 0,
    is_bundled_product: false,
    is_refunded: false,
    name_customer: item.name,
    name_merchant: item.name,
    configurable_fields: '',
    cost_price_ex_tax: '0',
    cost_price_inc_tax: '0',
    cost_price_tax: '0',
    wrapping_cost_ex_tax: '0',
    wrapping_cost_inc_tax: '0',
    wrapping_cost_tax: '0',
    wrapping_id: 0,
    wrapping_message: '',
    wrapping_name: '',
  };
}

function convertDigitalLineItemToProduct(
  item: OrderDigitalLineItem,
  decimalPlaces: number,
  consignmentEntityId: number,
): OrderProductItem {
  const unitPrice = item.quantity > 0 ? item.subTotalListPrice.value / item.quantity : 0;
  const formattedUnitPrice = formatPrice(unitPrice, decimalPlaces);
  const formattedTotal = formatPrice(item.subTotalListPrice.value, decimalPlaces);

  return {
    id: item.entityId,
    product_id: item.productEntityId,
    variant_id: 0,
    sku: '',
    name: item.name,
    brand: '',
    quantity: item.quantity,
    imageUrl: '',
    type: 'digital',
    price_inc_tax: formattedUnitPrice,
    price_ex_tax: formattedUnitPrice,
    price_tax: '0',
    total_inc_tax: formattedTotal,
    total_ex_tax: formattedTotal,
    total_tax: '0',
    base_price: formattedUnitPrice,
    base_total: formattedTotal,
    quantity_shipped: 0,
    quantity_refunded: 0,
    refund_amount: '0',
    return_id: 0,
    optionList: item.productOptions.map((o) => ({
      optionId: 0,
      optionValue: o.value,
      type: o.name,
    })),
    product_options: [],
    order_address_id: consignmentEntityId,
    order_id: 0,
    parent_order_product_id: 0,
    option_set_id: 0,
    is_bundled_product: false,
    is_refunded: false,
    name_customer: item.name,
    name_merchant: item.name,
    configurable_fields: '',
    cost_price_ex_tax: '0',
    cost_price_inc_tax: '0',
    cost_price_tax: '0',
    wrapping_cost_ex_tax: '0',
    wrapping_cost_inc_tax: '0',
    wrapping_cost_tax: '0',
    wrapping_id: 0,
    wrapping_message: '',
    wrapping_name: '',
  };
}

function gatherAllProducts(order: Order, decimalPlaces: number): OrderProductItem[] {
  const physical = (order.consignments?.shipping?.edges ?? []).flatMap((edge) =>
    edge.node.lineItems.edges.map((le) =>
      convertLineItemToProduct(le.node, decimalPlaces, edge.node.entityId),
    ),
  );

  const digital = (order.consignments?.downloads?.edges ?? []).flatMap((edge) =>
    edge.node.lineItems.edges.map((le) =>
      convertDigitalLineItemToProduct(le.node, decimalPlaces, edge.node.entityId),
    ),
  );

  return [...physical, ...digital];
}

function deduplicateProducts(products: OrderProductItem[]): OrderProductItem[] {
  return products.reduce<OrderProductItem[]>((seen, product) => {
    const idx = seen.findIndex((item) => Number(item.variant_id) === Number(product.variant_id));
    if (idx === -1) {
      seen.push(product);
    } else {
      seen[idx] = {
        ...seen[idx],
        quantity: Number(seen[idx].quantity) + Number(product.quantity),
      };
    }
    return seen;
  }, []);
}

// ===========================================================================
// Shipments conversion (B2B-4826)
// ===========================================================================

function convertShippings(order: Order, decimalPlaces: number): OrderShippingsItem[] {
  if (!order.consignments?.shipping?.edges?.length) {
    return [];
  }

  return order.consignments.shipping.edges.map((edge) => {
    const consignment = edge.node;
    const address = convertAddress(consignment.shippingAddress);

    const products = consignment.lineItems.edges.map((le) =>
      convertLineItemToProduct(le.node, decimalPlaces, consignment.entityId),
    );

    const hasShipments = consignment.shipments.edges.length > 0;

    const productsWithShipStatus = products.map((p) => ({
      ...p,
      quantity_shipped: hasShipments ? p.quantity : 0,
      not_shipping_number: hasShipments ? 0 : p.quantity,
    }));

    const shipmentItems = consignment.shipments.edges.map((se) => {
      const shipment = se.node;
      return {
        id: shipment.entityId,
        order_id: order.entityId,
        order_address_id: consignment.entityId,
        date_created: shipment.shippedAt.utc,
        shipping_method: shipment.shippingMethodName,
        shipping_provider_display_name: shipment.shippingProviderName,
        tracking_number: shipment.tracking?.number ?? '',
        tracking_link: shipment.tracking?.url ?? '',
        tracking_carrier: shipment.shippingProviderName,
        generated_tracking_link: shipment.tracking?.url,
        billing_address: convertAddress(order.billingAddress),
        comments: '',
        customer_id: 0,
        items: products.map((p) => ({
          order_product_id: p.id,
          product_id: p.product_id,
          quantity: p.quantity,
        })),
        merchant_shipping_cost: '0',
        shipping_address: address,
        itemsInfo: productsWithShipStatus.map((p) => ({
          ...p,
          current_quantity_shipped: p.quantity,
        })),
      };
    });

    const notShipItems = hasShipments
      ? []
      : productsWithShipStatus.map((p) => ({
          ...p,
          not_shipping_number: p.quantity,
        }));

    const shippingCost = formatPrice(consignment.shippingCost.value, decimalPlaces);

    return {
      ...address,
      id: consignment.entityId,
      order_id: order.entityId,
      base_cost: shippingCost,
      base_handling_cost: '0',
      cost_ex_tax: shippingCost,
      cost_inc_tax: shippingCost,
      cost_tax: '0',
      cost_tax_class_id: 0,
      handling_cost_ex_tax: '0',
      handling_cost_inc_tax: '0',
      handling_cost_tax: '0',
      handling_cost_tax_class_id: 0,
      items_shipped: hasShipments ? products.length : 0,
      items_total: products.length,
      shipping_method: shipmentItems[0]?.shipping_method ?? '',
      shipping_quotes: '',
      shipping_zone_id: 0,
      shipping_zone_name: '',
      shipmentItems,
      notShip: {
        itemsInfo: notShipItems,
      },
    } as OrderShippingsItem;
  });
}

// ===========================================================================
// Billing conversion (B2B-4826)
// ===========================================================================

function convertBillings(order: Order, allProducts: OrderProductItem[]): OrderBillings[] {
  return [
    {
      billingAddress: convertAddress(order.billingAddress),
      digitalProducts: allProducts.filter((p) => p.type === 'digital'),
    },
  ];
}

// ===========================================================================
// Payment (expanded for B2B-4826)
// ===========================================================================

function buildPayment(order: Order): OrderPayment {
  const dateCreateAt = Math.floor(new Date(order.orderedAt.utc).getTime() / 1000);
  return {
    dateCreateAt: String(dateCreateAt),
    billingAddress: convertAddress(order.billingAddress),
    paymentMethod: order.payments?.[0]?.description ?? '',
    updatedAt: order.updatedAt.utc,
  };
}

// ===========================================================================
// Main converter
// ===========================================================================

export function convertOrderDetail(
  order: Order,
  b3Lang: LangFormatFunction,
  currencies: Currency[],
): Pick<
  OrderDetailsState,
  | 'orderId'
  | 'status'
  | 'customStatus'
  | 'poNumber'
  | 'currencyCode'
  | 'money'
  | 'orderSummary'
  | 'history'
  | 'orderComments'
  | 'payment'
  | 'shippings'
  | 'billings'
  | 'products'
  | 'digitalProducts'
  | 'billingAddress'
  | 'canReturn'
  | 'orderIsDigital'
  | 'ipStatus'
  | 'invoiceId'
  | 'createdEmail'
  | 'companyInfo'
  | 'customerId'
> {
  const moneyFormat = buildMoneyFormat(currencies, order.totalIncTax.currencyCode);
  const decimalPlaces = moneyFormat.decimal_places;

  const allProducts = gatherAllProducts(order, decimalPlaces);
  const products = deduplicateProducts(allProducts);
  const digitalProducts = products.filter((p) => p.type === 'digital');

  const companyInfo: CompanyInfoTypes = {
    companyId: order.company ? String(order.company.entityId) : '',
    companyName: order.company?.name ?? '',
    companyAddress: '',
    companyCountry: '',
    companyState: '',
    companyCity: '',
    companyZipCode: '',
    phoneNumber: '',
    bcId: '',
  };

  return {
    orderId: order.entityId,
    status: order.status.label,
    customStatus: '',
    poNumber: order.reference ?? '',
    currencyCode: order.totalIncTax.currencyCode,
    money: moneyFormat,
    orderSummary: buildOrderSummary(order, b3Lang, decimalPlaces),
    payment: buildPayment(order),
    history: mapHistoryEvents(order.history),
    orderComments: order.customerMessage ?? '',
    shippings: convertShippings(order, decimalPlaces),
    billings: convertBillings(order, allProducts),
    products,
    digitalProducts,
    billingAddress: convertAddress(order.billingAddress),
    canReturn: order.canReturn ?? false,
    orderIsDigital: digitalProducts.length > 0,
    ipStatus: order.invoice ? 1 : 0,
    invoiceId: order.invoice ? Number(order.invoice.id) : 0,
    createdEmail: order.placedBy?.email ?? '',
    companyInfo,
    customerId: order.placedBy?.entityId,
  };
}
