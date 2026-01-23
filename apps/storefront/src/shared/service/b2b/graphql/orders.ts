import { B2BOrderData, MoneyFormat, OrderStatusItem } from '@/types';

import { convertArrayToGraphql } from '../../../../utils/graphqlDataConvert';
import B3Request from '../../request/b3Fetch';

const companyInfo = `
  companyInfo {
    companyId,
    companyName,
    companyAddress,
    companyCountry,
    companyState,
    companyCity,
    companyZipCode,
    phoneNumber,
    bcId,
  }
`;

export interface CustomerOrderNode {
  node: {
    orderId?: string;
    createdAt: number;
    updatedAt: number;
    totalIncTax?: number;
    currencyCode?: string;
    usdIncTax?: number;
    money?: unknown;
    items?: number;
    cartId?: string;
    userId: number;
    poNumber?: string;
    referenceNumber?: string;
    status: string;
    customStatus?: string;
    statusCode: number;
    isArchived?: boolean;
    isInvoiceOrder: 'A_0' | 'A_1';
    invoiceId?: string;
    invoiceNumber?: string;
    invoiceStatus?: string;
    ipStatus?: 'A_0' | 'A_1' | 'A_2';
    flag?: 'A_0' | 'A_1' | 'A_2' | 'A_3';
    billingName?: string;
    companyName?: string;
    firstName?: string;
    lastName?: string;
    merchantEmail?: string;
  };
}

export interface GetCustomerOrders {
  data: {
    customerOrders: {
      totalCount: number;
      pageInfo: {
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      };
      edges: CustomerOrderNode[];
    };
  };
}

const allOrders = (data: CustomFieldItems, fn: 'allOrders' | 'customerOrders') => `
query ${fn === 'allOrders' ? 'GetAllOrders' : 'GetCustomerOrders'} {
  ${fn}(
    search: "${data.q || ''}"
    status: "${data.statusCode || ''}"
    first: ${data.first}
    offset: ${data.offset}
    beginDateAt: ${data.beginDateAt ? JSON.stringify(data.beginDateAt) : null}
    endDateAt: ${data.endDateAt ? JSON.stringify(data.endDateAt) : null}
    companyName: "${data.companyName || ''}"
    createdBy: "${data.createdBy || ''}"
    isShowMy: "${data.isShowMy || 0}"
    orderBy: "${data.orderBy}"
    email: "${data.email || ''}"
    ${data.companyIds ? `companyIds: ${convertArrayToGraphql(data.companyIds || [])}` : ''}
  ){
    totalCount,
    pageInfo{
      hasNextPage,
      hasPreviousPage,
    },
    edges{
      node {
        orderId,
        createdAt,
        updatedAt,
        totalIncTax,
        currencyCode,
        usdIncTax,
        money,
        items,
        cartId,
        userId,
        poNumber,
        referenceNumber,
        status,
        customStatus,
        statusCode,
        isArchived,
        isInvoiceOrder,
        invoiceId,
        invoiceNumber,
        invoiceStatus,
        ipStatus,
        flag,
        billingName,
        merchantEmail,
        firstName,
        lastName,
        companyName,
        ${companyInfo}
      }
    }
  }
}`;

export interface CustomerOrderShippingAddress {
  id: number;
  zip: string;
  city: string;
  email: string;
  phone: string;
  state: string;
  company: string;
  country: string;
  cost_tax: string;
  order_id: number;
  street_1: string;
  street_2: string;
  base_cost: string;
  last_name: string;
  first_name: string;
  cost_ex_tax: string;
  items_total: number;
  cost_inc_tax: string;
  country_iso2: string;
  items_shipped: number;
  shipping_method: string;
  shipping_zone_id: number;
  cost_tax_class_id: number;
  handling_cost_tax: string;
  base_handling_cost: string;
  shipping_zone_name: string;
  handling_cost_ex_tax: string;
  handling_cost_inc_tax: string;
  handling_cost_tax_class_id: number;
}

export interface OrderProduct {
  id: number;
  sku: string;
  name: string;
  imageUrl: string;
  quantity: number;
  base_price: string;
  productUrl: string;
  variant_id: number;
  product_id: number;
  price_ex_tax: string;
  price_inc_tax: string;
  product_options: Array<{
    product_option_id: number;
    option_id: number;
    display_name: string;
    display_value: string;
    value: string;
  }>;
  order_address_id: number;
  quantity_shipped: number;
  type: 'physical' | 'digital';
}

export interface Shipment {
  id: number;
  shipping_method: string;
  shipping_provider_display_name: string;
  date_created: string;
  items: Array<{
    quantity: number;
    order_product_id: number;
  }>;
  order_address_id: number;
  tracking_number: string;
  tracking_link: string;
  generated_tracking_link: string;
}

interface OrderHistoryEvent {
  id: number;
  eventType: number;
  status: string;
  createdAt: number;
}

export interface GetCustomerOrder {
  data: {
    customerOrder: {
      id: string;
      dateCreated: number;
      firstName: string;
      lastName: string;
      poNumber?: string;
      shippingAddress: CustomerOrderShippingAddress[];
      coupons: [];
      money?: MoneyFormat;

      paymentMethod: string;

      status: string;

      totalTax: number;
      totalExTax: number;
      discountAmount: number;
      handlingCostExTax: number;
      subtotalExTax: number;
      shippingCostExTax: number;

      companyInfo: {
        companyId: null;
      };

      shipments: false | Shipment[];

      products: OrderProduct[];
      billingAddress: {
        email: string;
        first_name: string;
        last_name: string;
        phone: string;
        company: string;
        street_1: string;
        street_2: string;
        zip: string;
        city: string;
        state: string;
        country: string;
      };

      orderHistoryEvent?: OrderHistoryEvent[];
    };
  };
}

const orderDetail = (id: number, fn: 'order' | 'customerOrder') => `
query ${fn === 'order' ? 'GetOrder' : 'GetCustomerOrder'} {
  ${fn}(
    id: ${id}
  ){
    id,
    companyName,
    firstName,
    lastName,
    status,
    statusId,
    customerId,
    customStatus,
    dateCreated,
    dateModified,
    dateShipped,
    subtotalExTax,
    subtotalIncTax,
    subtotalTax,
    baseShippingCost,
    shippingCostExTax,
    shippingCostIncTax,
    shippingCostTax,
    shippingCostTaxClassId,
    baseHandlingCost,
    handlingCostExTax,
    handlingCostIncTax,
    handlingCostTax,
    handlingCostTaxClassId,
    baseWrappingCost,
    wrappingCostExTax,
    wrappingCostIncTax,
    wrappingCostTax,
    wrappingCostTaxClassId,
    totalExTax,
    totalIncTax,
    totalTax,
    itemsTotal,
    itemsShipped,
    paymentMethod,
    paymentProviderId,
    paymentStatus,
    refundedAmount,
    orderIsDigital,
    storeCreditAmount,
    giftCertificateAmount,
    ipAddress,
    geoipCountry,
    geoipCountryIso2,
    currencyId,
    currencyCode,
    currencyExchangeRate,
    defaultCurrencyId,
    defaultCurrencyCode,
    staffNotes,
    customerMessage,
    discountAmount,
    couponDiscount,
    shippingAddressCount,
    isDeleted,
    ebayOrderId,
    cartId,
    ipAddressV6,
    isEmailOptIn,
    poNumber,
    storeDefaultCurrencyCode,
    storeDefaultToTransactionalExchangeRate,
    customerLocale,
    channelId,
    orderSource,
    externalSource,
    creditCardType,
    externalId,
    externalMerchantId,
    taxProviderId,
    canReturn,
    createdEmail,
    products,
    coupons,
    extraFields,
    billingAddress,
    shippingAddresses,
    shippingAddress,
    shipments,
    money,
    referenceNumber,
    isInvoiceOrder,
    updatedAt,
    externalOrderId,
    ipStatus,
    invoiceId,
    orderHistoryEvent {
      id,
      eventType,
      status,
      extraFields,
      createdAt,
    },
    ${companyInfo}
  }
}`;

export interface CustomerOrderStatus {
  systemLabel: string;
  customLabel: string;
  statusCode: string;
}

export interface CustomerOrderStatues {
  data: {
    bcOrderStatuses: CustomerOrderStatus[];
  };
}

const getOrderStatusTypeQl = (fn: 'orderStatuses' | 'bcOrderStatuses') => `
query ${fn === 'orderStatuses' ? 'GetOrderStatuses' : 'GetCustomerOrderStatuses'} {
  ${fn} {
    systemLabel,
    customLabel,
    statusCode,
  }
}`;

export const getB2BAllOrders = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: allOrders(data, 'allOrders'),
  }).then((res) => res.allOrders);

export const getBCAllOrders = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: allOrders(data, 'customerOrders'),
  }).then((res) => res.customerOrders);

export const getB2BOrderDetails = (id: number): Promise<B2BOrderData> =>
  B3Request.graphqlB2B({
    query: orderDetail(id, 'order'),
  }).then((res) => res.order);

export const getBCOrderDetails = (id: number): Promise<B2BOrderData> =>
  B3Request.graphqlB2B({
    query: orderDetail(id, 'customerOrder'),
  }).then((res) => res.customerOrder);

export const getOrderStatusType = (): Promise<OrderStatusItem[]> =>
  B3Request.graphqlB2B({
    query: getOrderStatusTypeQl('orderStatuses'),
  }).then((res) => res.orderStatuses);

export const getBcOrderStatusType = (): Promise<OrderStatusItem[]> =>
  B3Request.graphqlB2B({
    query: getOrderStatusTypeQl('bcOrderStatuses'),
  }).then((res) => res.bcOrderStatuses);
