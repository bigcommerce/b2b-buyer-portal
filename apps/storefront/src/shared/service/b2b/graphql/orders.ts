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

const allOrders = (data: CustomFieldItems, fn: string) => `{
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

const getOrderStatusTypeQl = (fn: string) => `{
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
