import {
  B3Request,
} from '../../request/b3Fetch'

import {
  storeHash,
} from '../../../../utils/basicConfig'

import {
  convertArrayToGraphql,
  convertObjectToGraphql,
} from '../../../../utils'

const getQuotesList = (data: CustomFieldItems, type: string) => `{
  ${type === 'b2b' ? 'quotes' : 'customerQuotes'}(
    first: ${data.first}
    offset: ${data.offset}
    search: "${data.q || ''}"
    orderBy: "${data?.orderBy || ''}"
    createdBy: "${data?.createdBy || ''}"
    salesRep: "${data?.salesRep || ''}"
    ${data?.status ? `salesRep: "${data.status}"` : ''}
    ${data?.dateCreatedBeginAt ? `dateCreatedBeginAt: "${data.dateCreatedBeginAt}"` : ''}
  ) {
    totalCount,
    edges {
      node {
        id,
        createdAt,
        updatedAt,
        quoteNumber,
        quoteTitle,
        referenceNumber,
        createdBy,
        expiredAt,
        expiredAt,
        discount,
        grandTotal,
        currency,
        status,
        salesRep,
        orderId,
        subtotal,
      }
    }
  }
}`

const getCustomerAddresses = () => `{
  customerAddresses (
    first: 50
    offset: 0
  ){
    totalCount,
    edges {
      node {
        id,
        createdAt,
        updatedAt,
        firstName,
        lastName,
        company,
        bcAddressId,
        address1,
        address2,
        city,
        stateOrProvince,
        postalCode,
        country,
        countryCode,
        phone,
        addressType,
      },
    },
  }
}`

const getAddresses = (companyId: number) => `{
  addresses (
    first: 50
    offset: 0
    companyId: ${companyId}
  ){
    totalCount,
    edges{
      node{
        id,
        createdAt,
        updatedAt,
        firstName,
        lastName,
        isShipping,
        isBilling,
        addressLine1,
        addressLine2,
        address,
        city,
        state,
        stateCode,
        country,
        countryCode,
        zipCode,
        phoneNumber,
        isActive,
        label,
        company,
        uuid,
        isDefaultShipping,
        isDefaultBilling,
      },
    },
  }
}`

const quoteCreate = (data: CustomFieldItems) => `mutation{
  quoteCreate(quoteData: {
    notes: "${data.notes}",
    legalTerms: "${data.legalTerms}",
    totalAmount: "${data.totalAmount}",
    grandTotal: "${data.grandTotal}",
    subtotal: "${data.subtotal || ''}",
    ${data?.companyId ? `companyId: ${data.companyId}` : ''}
    storeHash: "${data.storeHash}",
    discount: "${data.discount}",
    channelId: ${data.channelId},
    userEmail: "${data?.userEmail || ''}",
    currency: ${convertObjectToGraphql(data.currency)}
    shippingAddress: ${convertObjectToGraphql(data.shippingAddress)}
    billingAddress: ${convertObjectToGraphql(data.billingAddress)}
    contactInfo: ${convertObjectToGraphql(data.contactInfo)}
    productList: ${convertArrayToGraphql(data.productList || [])}
  }) {
    quote{
      id,
      createdAt,
    }
  }
}`

const getQuoteInfo = (data: {
  id: number,
  date: string,
}) => `{
  quote(
    id: ${data.id},
    storeHash: "${storeHash}",
    date:  "${data?.date || ''}",
  ) {
    id,
    createdAt,
    updatedAt,
    quoteNumber,
    quoteTitle,
    referenceNumber,
    userEmail,
    bcCustomerId,
    createdBy,
    expiredAt,
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
      },
    },
    salesRepStatus,
    customerStatus,
    subtotal,
    discount,
    grandTotal,
    cartId,
    cartUrl,
    checkoutUrl,
    bcOrderId,
    currency,
    contactInfo,
    trackingHistory,
    extraFields {
      fieldName,
      fieldValue,
    },
    notes,
    legalTerms,
    shippingTotal,
    taxTotal,
    totalAmount,
    shippingMethod,
    billingAddress,
    oldSalesRepStatus,
    oldCustomerStatus,
    recipients,
    discountType,
    discountValue,
    status,
    company,
    salesRep,
    salesRepEmail,
    orderId,
    shippingAddress,
    productsList {
      productId,
      sku,
      basePrice,
      discount,
      offeredPrice,
      quantity,
      variantId,
      imageUrl,
      orderQuantityMaximum,
      orderQuantityMinimum,
      productName,
      options,
      notes,
      costPrice,
      inventoryTracking,
      inventoryLevel,
    },
    storefrontAttachFiles {
      id,
      fileName,
      fileType,
      fileUrl,
    },
    backendAttachFiles {
      id,
      fileName,
      fileType,
      fileUrl,
    },
    storeInfo {
      storeName,
      storeAddress,
      storeCountry,
      storeLogo,
      storeUrl,
    },
    companyInfo {
      companyId,
      companyName,
      companyAddress,
      companyCountry,
      companyState,
      companyCity,
      companyZipCode,
      phoneNumber,
    },
    salesRepInfo {
      salesRepName,
      salesRepEmail,
      salesRepPhoneNumber,
    },
    quoteLogo,
    quoteUrl,
    channelId,
    channelName,
  }
}`

const exportQuotePdf = (data: {
  quoteId: number,
  currency: object,
}) => `mutation{
  quotePdfExport(
    quoteId: ${data.quoteId},
    currency:  ${convertObjectToGraphql(data.currency || {})},
    storeHash: "${storeHash}",
  ) {
    url,
  }
}`

export const getBCCustomerAddresses = (): CustomFieldItems => B3Request.graphqlProxyBC({
  query: getCustomerAddresses(),
})

export const getB2BCustomerAddresses = (companyId: number): CustomFieldItems => B3Request.graphqlB2B({
  query: getAddresses(companyId),
})

export const getB2BQuotesList = (data: CustomFieldItems): CustomFieldItems => B3Request.graphqlB2B({
  query: getQuotesList(data, 'b2b'),
})

export const getBCQuotesList = (data: CustomFieldItems): CustomFieldItems => B3Request.graphqlProxyBC({
  query: getQuotesList(data, 'bc'),
})

export const createQuote = (data: CustomFieldItems): CustomFieldItems => B3Request.graphqlB2B({
  query: quoteCreate(data),
})

export const createBCQuote = (data: CustomFieldItems): CustomFieldItems => B3Request.graphqlProxyBC({
  query: quoteCreate(data),
})

export const getB2BQuoteDetail = (data: { id: number, date: string }): CustomFieldItems => B3Request.graphqlB2B({
  query: getQuoteInfo(data),
})

export const getBcQuoteDetail = (data: { id: number, date: string }): CustomFieldItems => B3Request.graphqlProxyBC({
  query: getQuoteInfo(data),
})

export const exportB2BQuotePdf = (data: { quoteId: number, currency: object }): CustomFieldItems => B3Request.graphqlB2B({
  query: exportQuotePdf(data),
})
