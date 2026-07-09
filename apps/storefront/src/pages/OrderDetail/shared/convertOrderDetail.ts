import type { LangFormatFunction } from '@/lib/lang';
import type {
  Money,
  Order,
  OrderAddress,
  OrderDigitalLineItem,
  OrderLineItem,
  OrderLineItemProductOption,
} from '@/shared/service/bc/graphql/orders';
import { OrderHistoryEventType } from '@/shared/service/bc/graphql/orders';
import type {
  Address,
  CompanyInfoTypes,
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

/** Format a Money value for display, preferring the server-formatted string. */
function formatMoney(money: Money): string {
  return money.formattedV2 ?? money.value.toFixed(2);
}

// ===========================================================================
// Order summary
// ===========================================================================

function buildOrderSummary(order: Order, b3Lang: LangFormatFunction): OrderSummary {
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
    couponPrices[key] = formatMoney(coupon.discountedAmount);
    couponSymbols[key] = 'coupon';
  });

  const placedByName = order.placedBy
    ? `${order.placedBy.firstName} ${order.placedBy.lastName}`.trim()
    : '';

  return {
    createAt: order.orderedAt.utc,
    name: placedByName,
    priceData: {
      [labels.subTotal]: formatMoney(order.subTotal),
      [labels.shipping]: formatMoney(order.shippingCostTotal),
      ...(hasHandlingFee && {
        [labels.handlingFee]: formatMoney(order.handlingCostTotal),
      }),
      [labels.discountAmount]: formatMoney(order.discounts.nonCouponDiscountTotal),
      ...couponPrices,
      [labels.tax]: formatMoney(order.taxTotal),
      [labels.grandTotal]: formatMoney(order.totalIncTax),
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
// History
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
// Address conversion
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

interface LineItemBase {
  entityId: number;
  productEntityId: number;
  name: string;
  quantity: number;
  productOptions: OrderLineItemProductOption[];
  subTotalListPrice: Money;
  subTotalSalePrice: Money;
}

function buildOrderProduct(
  item: LineItemBase,
  productType: 'physical' | 'digital',
  consignmentEntityId: number,
  physicalFields?: {
    variantEntityId: number | null;
    sku: string;
    brand: string | null;
    imageUrl: string;
  },
): OrderProductItem {
  // Unit price from list price (per Jesse/Shayne decision — no unit price Money field exists)
  const unitListPrice = item.quantity > 0 ? item.subTotalListPrice.value / item.quantity : 0;
  const formattedUnitPrice = String(unitListPrice);
  const formattedTotal = String(item.subTotalSalePrice.value);

  const { currencyCode } = item.subTotalSalePrice;
  const intlFormat = (value: number) =>
    new Intl.NumberFormat('en', { style: 'currency', currency: currencyCode }).format(value);

  return {
    id: item.entityId,
    product_id: item.productEntityId,
    // Fallback to 0 when variantEntityId is null (gist: "null for legacy
    // orders or products without variants"). BE is adding variantEntityId
    // to OrderPhysicalLineItem — until deployed, reorder sends 0 (honest
    // "no variant") rather than an unrelated ID. Behind FF, tracked in B2B-4787.
    variant_id: physicalFields?.variantEntityId ?? 0,
    sku: physicalFields?.sku ?? '',
    name: item.name,
    brand: physicalFields?.brand ?? '',
    quantity: item.quantity,
    imageUrl: physicalFields?.imageUrl ?? '',
    type: productType,
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
      optionId: o.productAttributeEntityId ?? 0,
      optionValue: o.productAttributeValueEntityId?.toString() ?? o.value,
      type: o.name,
    })),
    product_options: item.productOptions.map((o) => ({
      id: o.productAttributeEntityId ?? 0,
      option_id: o.productAttributeEntityId ?? 0,
      order_product_id: item.entityId,
      product_option_id: o.productAttributeEntityId ?? 0,
      name: o.name,
      value: o.value,
      display_name: o.name,
      display_name_customer: o.name,
      display_name_merchant: o.name,
      display_style: '',
      display_value: o.value,
      display_value_customer: o.value,
      display_value_merchant: o.value,
      type: '',
    })),
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
    formattedPrice: intlFormat(unitListPrice),
    formattedTotal: item.subTotalSalePrice.formattedV2 ?? intlFormat(item.subTotalSalePrice.value),
  };
}

function convertLineItemToProduct(
  item: OrderLineItem,
  consignmentEntityId: number,
): OrderProductItem {
  return buildOrderProduct(item, 'physical', consignmentEntityId, {
    variantEntityId: item.variantEntityId,
    sku: item.sku ?? '',
    brand: item.brand ?? '',
    imageUrl: item.image?.url ?? '',
  });
}

function convertDigitalLineItemToProduct(
  item: OrderDigitalLineItem,
  consignmentEntityId: number,
): OrderProductItem {
  return buildOrderProduct(item, 'digital', consignmentEntityId);
}

function gatherAllProducts(order: Order): OrderProductItem[] {
  const physical = (order.consignments?.shipping?.edges ?? []).flatMap((edge) =>
    edge.node.lineItems.edges.map((le) => convertLineItemToProduct(le.node, edge.node.entityId)),
  );

  const digital = (order.consignments?.downloads?.edges ?? []).flatMap((edge) =>
    edge.node.lineItems.edges.map((le) =>
      convertDigitalLineItemToProduct(le.node, edge.node.entityId),
    ),
  );

  return [...physical, ...digital];
}

function deduplicateProducts(products: OrderProductItem[]): OrderProductItem[] {
  return products.reduce<OrderProductItem[]>((seen, product) => {
    // Skip dedup for variant_id 0 — these are distinct products that lack
    // variant IDs (variantEntityId null from SF GQL). Legacy path never has
    // variant_id 0 so this doesn't affect legacy parity.
    const idx = product.variant_id
      ? seen.findIndex((item) => Number(item.variant_id) === Number(product.variant_id))
      : -1;
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
// Shipments conversion
// ===========================================================================

function convertShippings(order: Order): OrderShippingsItem[] {
  if (!order.consignments?.shipping?.edges?.length) {
    return [];
  }

  return order.consignments.shipping.edges.map((edge) => {
    const consignment = edge.node;
    const address = convertAddress(consignment.shippingAddress);

    const products = consignment.lineItems.edges.map((le) =>
      convertLineItemToProduct(le.node, consignment.entityId),
    );

    // Sum shipped quantity per line item across all shipments.
    // shipment.items[].lineItemId references lineItem.entityId (product.id).
    const shippedByLineItem = new Map<number, number>();
    consignment.shipments.edges.forEach((se) => {
      se.node.items.forEach((item) => {
        shippedByLineItem.set(
          item.lineItemId,
          (shippedByLineItem.get(item.lineItemId) ?? 0) + item.quantity,
        );
      });
    });

    const productsWithShipStatus = products.map((p) => {
      const shipped = shippedByLineItem.get(p.id) ?? 0;
      return {
        ...p,
        quantity_shipped: shipped,
        not_shipping_number: p.quantity - shipped,
      };
    });

    const shipmentItems = consignment.shipments.edges.map((se) => {
      const shipment = se.node;

      // Only include products that were in this specific shipment.
      const shipmentProductInfo = shipment.items
        .map((item) => {
          const product = productsWithShipStatus.find((p) => p.id === item.lineItemId);
          if (!product) return null;
          return {
            ...product,
            current_quantity_shipped: item.quantity,
          };
        })
        .filter(Boolean);

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
        items: shipment.items.map((item) => ({
          order_product_id: item.lineItemId,
          product_id: productsWithShipStatus.find((p) => p.id === item.lineItemId)?.product_id ?? 0,
          quantity: item.quantity,
        })),
        merchant_shipping_cost: '0',
        shipping_address: address,
        itemsInfo: shipmentProductInfo,
      };
    });

    const notShipItems = productsWithShipStatus
      .filter((p) => p.quantity > p.quantity_shipped)
      .map((p) => ({
        ...p,
        not_shipping_number: p.quantity - p.quantity_shipped,
      }));

    const itemsShippedCount = productsWithShipStatus.filter((p) => p.quantity_shipped > 0).length;

    const shippingCost = formatMoney(consignment.shippingCost);

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
      items_shipped: itemsShippedCount,
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
// Billing conversion
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
// Payment
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
): Pick<
  OrderDetailsState,
  | 'orderId'
  | 'status'
  | 'customStatus'
  | 'poNumber'
  | 'currencyCode'
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
  const allProducts = gatherAllProducts(order);
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
    poNumber: order.poNumber ?? '',
    currencyCode: order.totalIncTax.currencyCode,
    orderSummary: buildOrderSummary(order, b3Lang),
    payment: buildPayment(order),
    history: mapHistoryEvents(order.history),
    orderComments: order.customerMessage ?? '',
    shippings: convertShippings(order),
    billings: convertBillings(order, products),
    products,
    digitalProducts,
    billingAddress: convertAddress(order.billingAddress),
    canReturn: (order.consignments?.shipping?.edges ?? []).some((edge) =>
      edge.node.lineItems.edges.some((le) => le.node.returnableQuantity > 0),
    ),
    orderIsDigital: digitalProducts.length > 0,
    ipStatus: order.invoice ? 1 : 0,
    invoiceId: order.invoice ? Number(order.invoice.id) : 0,
    createdEmail: order.placedBy?.email ?? '',
    companyInfo,
    customerId: order.placedBy?.entityId,
  };
}
