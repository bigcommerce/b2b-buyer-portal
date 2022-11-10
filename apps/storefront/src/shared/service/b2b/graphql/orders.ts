import {
  B3Request,
} from '../../request/b3Fetch'

// import {
//   convertArrayToGraphql,
//   storeHash,
// } from '../../../../utils'

interface CustomFieldItems {
  [key: string]: any
}

const allOrders = (data: CustomFieldItems, fn: string) => `{
  ${fn}(
    search: "${data.q || ''}"
    status: "${data?.statusCode || ''}"
    first: ${data.first}
    offset: ${data.offset}
    beginDateAt: "${data.beginDateAt}"
    endDateAt: "${data.endDateAt}"
    companyName: "${data?.companyName || ''}"
    createdBy: "${data?.createdBy || ''}"
    isShowMy: "${data?.isShowMy || 0}"
    orderBy: "${data.orderBy}"
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
        companyId {
          id,
          companyName,
          bcGroupName,
          description,
          catalogId,
          companyStatus,
          addressLine1,
          addressLine2,
          city,
          state,
          zipCode,
          country,
          extraFields {
            fieldName,
            fieldValue,
          }
        }
      }
    }
  }
}`

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
    extraInt1,
    extraInt2,
    extraInt3,
    extraInt4,
    extraInt5,
    extraStr1,
    extraStr2,
    extraStr3,
    extraStr4,
    extraStr5,
    extraText,
    extraInfo,
    money,
    referenceNumber,
    isInvoiceOrder,
    updatedAt,
    externalOrderId,
    orderHistoryEvent {
      id,
      eventType,
      status,
      extraFields,
      createdAt,
    },
  }
}`

const getOrderStatusTypeQl = () => `{
  orderStatuses {
    systemLabel,
    customLabel,
    statusCode,
  }
}`

export const getB2BAllOrders = (data: CustomFieldItems) => B3Request.graphqlB2B({
  query: allOrders(data, 'allOrders'),
})

export const getBCAllOrders = (data: CustomFieldItems) => B3Request.graphqlProxyBC({
  query: allOrders(data, 'customerOrders'),
})

export const getB2BOrderDetails = (id: number) => B3Request.graphqlB2B({
  query: orderDetail(id, 'order'),
})

export const getBCOrderDetails = (id: number) => B3Request.graphqlProxyBC({
  query: orderDetail(id, 'customerOrder'),
})

export const getOrderStatusType = () => B3Request.graphqlB2B({
  query: getOrderStatusTypeQl(),
})
