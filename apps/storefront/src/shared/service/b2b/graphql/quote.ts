import {
  convertArrayToGraphql,
  convertObjectToGraphql,
} from '../../../../utils'
import { storeHash } from '../../../../utils/basicConfig'
import B3Request from '../../request/b3Fetch'

const getQuotesList = (data: CustomFieldItems, type: string) => `{
  ${type === 'b2b' ? 'quotes' : 'customerQuotes'}(
    first: ${data.first}
    offset: ${data.offset}
    search: "${data.q || ''}"
    orderBy: "${data?.orderBy || ''}"
    createdBy: "${data?.createdBy || ''}"
    email: "${data?.email || ''}"
    salesRep: "${data?.salesRep || ''}"
    ${data?.status ? `status: "${data.status}"` : ''}
    ${
      data?.dateCreatedBeginAt
        ? `dateCreatedBeginAt: "${data.dateCreatedBeginAt}"`
        : ''
    }
    ${
      data?.dateCreatedEndAt
        ? `dateCreatedEndAt: "${data.dateCreatedEndAt}"`
        : ''
    }
    ${type === 'bc' ? `channelId: ${data?.currentChannelId || 1}` : ''}
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
        salesRepEmail,
        orderId,
        subtotal,
        totalAmount,
        taxTotal,
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
    message: "${data.message}",
    legalTerms: "${data.legalTerms}",
    totalAmount: "${data.totalAmount}",
    grandTotal: "${data.grandTotal}",
    subtotal: "${data.subtotal || ''}",
    taxTotal: "${data.taxTotal || ''}"
    ${data?.companyId ? `companyId: ${data.companyId}` : ''}
    storeHash: "${data.storeHash}",
    discount: "${data.discount}",
    channelId: ${data.channelId},
    userEmail: "${data?.userEmail || ''}",
    currency: ${convertObjectToGraphql(data.currency)}
    shippingAddress: ${convertObjectToGraphql(data.shippingAddress)}
    billingAddress: ${convertObjectToGraphql(data.billingAddress)}
    contactInfo: ${convertObjectToGraphql(data.contactInfo)}
    productList: ${convertArrayToGraphql(data.productList || [])},
    fileList: ${convertArrayToGraphql(data.fileList || [])}
  }) {
    quote{
      id,
      createdAt,
    }
  }
}`

const quoteUpdate = (data: CustomFieldItems) => `mutation{
  quoteUpdate(
    id: ${data.id},
    quoteData: ${convertObjectToGraphql(data.quoteData)}
  ) {
    quote{
      trackingHistory,
    }
  }
}`

const getQuoteInfo = (data: { id: number; date: string }) => `{
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
      createdBy,
    },
    backendAttachFiles {
      id,
      fileName,
      fileType,
      fileUrl,
      createdBy,
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
  quoteId: number
  createdAt: number
  isPreview: boolean
  lang: string
}) => `mutation{
  quoteFrontendPdf(
    quoteId: ${data.quoteId},
    storeHash: "${storeHash}",
    createdAt: ${data.createdAt},
    lang: "${data.lang}",
    isPreview: ${data.isPreview}
  ) {
    url,
    content,
  }
}`

const quoteCheckout = (data: { id: number }) => `mutation{
  quoteCheckout(
    id: ${data.id},
    storeHash: "${storeHash}",
  ) {
    quoteCheckout {
      checkoutUrl,
      cartId,
      cartUrl,
    }
  }
}`

const quoteAttachFileCreate = (data: CustomFieldItems) => `mutation{
  quoteAttachFileCreate(
    quoteId: ${data.quoteId},
    fileList: ${convertArrayToGraphql(data.fileList || [])}
  ) {
    attachFiles {
      id,
      createdBy,
      fileUrl,
    }
  }
}`

const quoteAttachFileDelete = (data: CustomFieldItems) => `mutation{
  quoteAttachFileDelete(
    quoteId: ${data.quoteId},
    fileId: ${data.fileId}
  ) {
    message
  }
}`

const getCreatedByUser = (companyId: number, module: number, fn: string) => `{
  ${fn}(
    companyId: ${companyId},
    module: ${module},
  ){
    results,
  }
}`

export const getBCCustomerAddresses = (): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: getCustomerAddresses(),
  })

export const getB2BCustomerAddresses = (companyId: number): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: getAddresses(companyId),
  })

export const getB2BQuotesList = (data: CustomFieldItems): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: getQuotesList(data, 'b2b'),
  })

export const getBCQuotesList = (data: CustomFieldItems): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: getQuotesList(data, 'bc'),
  })

export const createQuote = (data: CustomFieldItems): CustomFieldItems =>
  B3Request.graphqlB2B(
    {
      query: quoteCreate(data),
    },
    true
  )

export const createBCQuote = (data: CustomFieldItems): CustomFieldItems =>
  B3Request.graphqlB2B(
    {
      query: quoteCreate(data),
    },
    true
  )

export const updateB2BQuote = (data: CustomFieldItems): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: quoteUpdate(data),
  })

export const updateBCQuote = (data: CustomFieldItems): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: quoteUpdate(data),
  })

export const getB2BQuoteDetail = (data: {
  id: number
  date: string
}): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: getQuoteInfo(data),
  })

export const getBcQuoteDetail = (data: {
  id: number
  date: string
}): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: getQuoteInfo(data),
  })

export const exportB2BQuotePdf = (data: {
  quoteId: number
  createdAt: number
  isPreview: boolean
  lang: string
}): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: exportQuotePdf(data),
  })

export const exportBcQuotePdf = (data: {
  quoteId: number
  createdAt: number
  isPreview: boolean
  lang: string
}): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: exportQuotePdf(data),
  })

export const b2bQuoteCheckout = (data: { id: number }): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: quoteCheckout(data),
  })

export const bcQuoteCheckout = (data: { id: number }): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: quoteCheckout(data),
  })

export const quoteDetailAttachFileCreate = (
  data: CustomFieldItems
): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: quoteAttachFileCreate(data),
  })

export const quoteDetailAttachFileDelete = (
  data: CustomFieldItems
): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: quoteAttachFileDelete(data),
  })

export const getQuoteCreatedByUsers = (companyId: number, module: number) =>
  B3Request.graphqlB2B({
    query: getCreatedByUser(companyId, module, 'createdByUser'),
  })
