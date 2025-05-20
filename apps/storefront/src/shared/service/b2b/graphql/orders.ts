import { B2BOrderData, OrderStatusItem } from '@/types';

import { convertArrayToGraphql } from '../../../../utils';
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

export type CustomerOrderNode = {
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
};

export interface GetCustomerOrders {
  data: {
    customerOrders: {
      totalCount: number;
      pageInfo: {
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      };
      edges: Array<CustomerOrderNode>;
    };
  };
}

export type CompanyOrderNode = {
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
    companyInfo?: {
      companyName: string;
    };
  };
};

export interface GetCompanyOrders {
  data: {
    allOrders: {
      totalCount: number;
      pageInfo: {
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      };
      edges: Array<CustomerOrderNode>;
    };
  };
}

const allOrders = (data: CustomFieldItems, fn: 'allOrders' | 'customerOrders') => `
query ${fn === 'allOrders' ? 'GetAllOrders' : 'GetCustomerOrders'} {
  ${fn}(
    search: "${data.q || ''}"
    status: "${data?.statusCode || ''}"
    first: ${data.first}
    offset: ${data.offset}
    beginDateAt: ${data?.beginDateAt ? JSON.stringify(data.beginDateAt) : null}
    endDateAt: ${data?.endDateAt ? JSON.stringify(data.endDateAt) : null}
    companyName: "${data?.companyName || ''}"
    createdBy: "${data?.createdBy || ''}"
    isShowMy: "${data?.isShowMy || 0}"
    orderBy: "${data.orderBy}"
    email: "${data?.email || ''}"
    ${data?.companyIds ? `companyIds: ${convertArrayToGraphql(data.companyIds || [])}` : ''}
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

const orderDetail = (id: number, fn: string) => `{
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

export interface CompanyOrderStatuses {
  data: {
    orderStatuses: CustomerOrderStatus[];
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

const getCreatedByUser = (companyId: number, module: number, fn: string) => `
  query GetOrdersCreatedByUser {
    ${fn}(
      companyId: ${companyId},
      module: ${module},
    ){
      results,
    }
  }
`;

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

export const getOrdersCreatedByUser = (companyId: number, module: number) =>
  B3Request.graphqlB2B({
    query: getCreatedByUser(companyId, module, 'createdByUser'),
  });
