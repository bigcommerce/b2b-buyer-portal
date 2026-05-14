import type { LangFormatFunction } from '@/lib/lang';
import type { Order } from '@/shared/service/bc/graphql/orders';
import { OrderHistoryEventType } from '@/shared/service/bc/graphql/orders';
import type { Currency, MoneyFormat, OrderHistoryItem, OrderPayment, OrderSummary } from '@/types';

import type { OrderDetailsState } from '../context/OrderDetailsContext';

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

function buildPayment(order: Order): OrderPayment {
  const dateCreateAt = Math.floor(new Date(order.orderedAt.utc).getTime() / 1000);
  return {
    dateCreateAt: String(dateCreateAt),
  };
}

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
> {
  const moneyFormat = buildMoneyFormat(currencies, order.totalIncTax.currencyCode);

  return {
    orderId: order.entityId,

    // status.label matches the format the legacy API returns (e.g. "Pending").
    // getOrderStatusLabel() will look this up against the still-legacy
    // orderStatus list (getOrderStatusType / getBcOrderStatusType) to resolve
    status: order.status.label,

    // customStatus is not exposed by the unified endpoint.
    // getOrderStatusLabel() falls back to the status label when this is empty.
    customStatus: '',

    poNumber: order.reference ?? '',
    currencyCode: order.totalIncTax.currencyCode,
    money: moneyFormat,
    orderSummary: buildOrderSummary(order, b3Lang, moneyFormat.decimal_places),
    payment: buildPayment(order),
    history: mapHistoryEvents(order.history),
    orderComments: order.customerMessage ?? '',
  };
}
