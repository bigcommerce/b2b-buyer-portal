import { QuoteExtraFieldsType } from '@/types/quotes';
import { channelId, storeHash } from '@/utils/basicConfig';
import { convertArrayToGraphql, convertObjectToGraphql } from '@/utils/graphqlDataConvert';

import B3Request from '../../request/b3Fetch';

const getQuotesList = (data: CustomFieldItems, type: string) => `
  query GetQuotesList {
    ${type === 'b2b' ? 'quotes' : 'customerQuotes'}(
      first: ${data.first}
      offset: ${data.offset}
      search: "${data.q || ''}"
      orderBy: "${data?.orderBy || ''}"
      createdBy: "${data?.createdBy || ''}"
      email: "${data?.email || ''}"
      salesRep: "${data?.salesRep || ''}"
      ${data?.status ? `status: "${data.status}"` : ''}
      ${data?.dateCreatedBeginAt ? `dateCreatedBeginAt: "${data.dateCreatedBeginAt}"` : ''}
      ${data?.dateCreatedEndAt ? `dateCreatedEndAt: "${data.dateCreatedEndAt}"` : ''}
      ${type === 'bc' ? `channelId: ${data?.channelId || 1}` : ''}
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
          uuid,
        }
      }
    }
  }
`;

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
}`;

const getAddresses = (companyId: number) => `query Addresses {
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
}`;

const quoteCreate = (data: CustomFieldItems) => `mutation CreateQuote{
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
    fileList: ${convertArrayToGraphql(data.fileList || [])},
    quoteTitle: "${data.quoteTitle}"
    ${data?.extraFields ? `extraFields: ${convertArrayToGraphql(data?.extraFields || [])}` : ''}
    ${data?.referenceNumber ? `referenceNumber: "${data?.referenceNumber}"` : ''}
    ${data?.recipients ? `recipients: ${convertArrayToGraphql(data?.recipients || [])}` : ''}
  }) {
    quote{
      id,
      createdAt,
      uuid,
    }
  }
}`;

const quoteUpdate = (data: CustomFieldItems) => `mutation{
  quoteUpdate(
    id: ${data.id},
    quoteData: ${convertObjectToGraphql(data.quoteData)}
  ) {
    quote{
      trackingHistory,
    }
  }
}`;

const getQuoteInfo = (data: { id: number; date: string; uuid?: string }) => `
  query GetQuoteInfoB2B {
    quote(
      id: ${data.id},
      storeHash: "${storeHash}",
      date:  "${data?.date || ''}",
      ${data.uuid ? `uuid: "${data.uuid}",` : ''}
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
        purchaseHandled,
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
      allowCheckout,
      displayDiscount,
      uuid,
    }
  }
`;

const getExportQuotePdfQuery = (data: {
  quoteId: number;
  createdAt: number;
  isPreview: boolean;
  lang: string;
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
}`;

const getQuoteCheckoutQuery = (data: { id: number }) => `mutation CheckoutQuote {
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
}`;

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
}`;

const quoteAttachFileDelete = (data: CustomFieldItems) => `mutation{
  quoteAttachFileDelete(
    quoteId: ${data.quoteId},
    fileId: ${data.fileId}
  ) {
    message
  }
}`;

const getStorefrontProductSettings = `
query getStorefrontProductSettings($storeHash: String!, $channelId: Int) {
  storefrontProductSettings(storeHash: $storeHash, channelId: $channelId) {
    hidePriceFromGuests
  }
}
`;

const getQuoteExtraFields = `query getQuoteExtraFields($storeHash: String, $channelId: Int) {
  quoteExtraFieldsConfig(storeHash: $storeHash, channelId: $channelId) {
    fieldName,
    fieldType,
    isRequired,
    defaultValue,
    maximumLength,
    numberOfRows,
    maximumValue,
    listOfValue,
    visibleToEnduser,
    labelName,
    id,
    isUnique,
    valueConfigs,
    fieldCategory,
  }
}`;

export const getBCCustomerAddresses = () =>
  B3Request.graphqlB2B({
    query: getCustomerAddresses(),
  });

export const getB2BCustomerAddresses = (companyId: number, customMessage: boolean) =>
  B3Request.graphqlB2B(
    {
      query: getAddresses(companyId),
    },
    customMessage,
  );

export enum QuoteStatus {
  OPEN = 1,
  ORDERED = 4,
  EXPIRED = 5,
}

export interface QuoteEdge {
  node: {
    id: string;
    createdAt: number;
    updatedAt: number;
    quoteNumber: string;
    quoteTitle: string;
    referenceNumber: string;
    createdBy: string;
    expiredAt: number;
    discount: string;
    grandTotal: string;
    currency: {
      token: string;
      location: string;
      currencyCode: string;
      decimalToken: string;
      decimalPlaces: number;
      thousandsToken: string;
      currencyExchangeRate: string;
    };
    status: QuoteStatus;
    salesRep: string;
    salesRepEmail: string;
    orderId: string;
    subtotal: string;
    totalAmount: string;
    taxTotal: string;
    uuid?: string;
  };
}

export interface QuotesListB2B {
  data: { quotes: { totalCount: number; edges: QuoteEdge[] } };
}

export const getB2BQuotesList = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: getQuotesList(data, 'b2b'),
  }).then((res) => res.quotes);

export interface QuotesListBC {
  data: { customerQuotes: { totalCount: number; edges: QuoteEdge[] } };
}

export const getBCQuotesList = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: getQuotesList(data, 'bc'),
  }).then((res) => res.customerQuotes);

export const createQuote = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: quoteCreate(data),
  });

export const updateQuote = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: quoteUpdate(data),
  });

export interface B2BQuoteDetail {
  data: {
    quote: {
      id: string;
      createdAt: number;
      updatedAt: number;
      quoteNumber: string;
      quoteTitle: string;
      referenceNumber: string;
      userEmail: string;
      bcCustomerId: number;
      createdBy: string;
      expiredAt: number;
      companyId: {
        id: string;
        companyName: string;
        bcGroupName: string;
        description: string;
        catalogId: null | string;
        companyStatus: number;
        addressLine1: string;
        addressLine2: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
        extraFields: any[];
      };
      salesRepStatus: number;
      customerStatus: number;
      subtotal: string;
      discount: string;
      grandTotal: string;
      cartId: string;
      cartUrl: string;
      checkoutUrl: string;
      bcOrderId: string;
      currency: {
        token: string;
        location: string;
        currencyCode: string;
        decimalToken: string;
        decimalPlaces: number;
        thousandsToken: string;
        currencyExchangeRate: string;
      };
      contactInfo: {
        name: string;
        email: string;
        companyName: string;
        phoneNumber: string;
      };
      trackingHistory: {
        date: number;
        read: boolean;
        role: string;
        message: string;
      }[];
      extraFields: unknown[];
      notes: string;
      legalTerms: string;
      shippingTotal: string;
      taxTotal: string;
      totalAmount: string;
      shippingMethod: {
        id: string;
        cost: number;
        type: string;
        imageUrl: string;
        description: string;
        transitTime: string;
        additionalDescription: string;
      };
      billingAddress: {
        city: string;
        label: string;
        state: string;
        address: string;
        country: string;
        zipCode: string;
        lastName: string;
        addressId: string;
        apartment: string;
        firstName: string;
        phoneNumber: string;
        addressLabel: string;
      };
      oldSalesRepStatus: null | number;
      oldCustomerStatus: null | number;
      recipients: unknown[];
      discountType: number;
      discountValue: string;
      status: number;
      company: string;
      salesRep: string;
      salesRepEmail: string;
      orderId: string;
      shippingAddress: {
        city: string;
        label: string;
        state: string;
        address: string;
        country: string;
        zipCode: string;
        lastName: string;
        addressId: string;
        apartment: string;
        firstName: string;
        phoneNumber: string;
        addressLabel: string;
      };
      productsList: {
        productId: string;
        sku: string;
        basePrice: string;
        discount: string;
        offeredPrice: string;
        quantity: number;
        variantId: number;
        imageUrl: string;
        orderQuantityMaximum: number;
        orderQuantityMinimum: number;
        productName: string;
        purchaseHandled: boolean;
        options: {
          type: string;
          optionId: number;
          optionName: string;
          optionLabel: string;
          optionValue: string;
        }[];
        notes: string;
        costPrice: string;
        inventoryTracking: string;
        inventoryLevel: number;
      }[];
      storefrontAttachFiles: unknown[];
      backendAttachFiles: unknown[];
      storeInfo: {
        storeName: string;
        storeAddress: string;
        storeCountry: string;
        storeLogo: string;
        storeUrl: string;
      };
      companyInfo: {
        companyId: string;
        companyName: string;
        companyAddress: string;
        companyCountry: string;
        companyState: string;
        companyCity: string;
        companyZipCode: string;
        phoneNumber: string;
      };
      salesRepInfo: {
        salesRepName: null | string;
        salesRepEmail: null | string;
        salesRepPhoneNumber: null | string;
      };
      quoteLogo: string;
      quoteUrl: string;
      channelId: null | number;
      channelName: string;
      allowCheckout: boolean;
      displayDiscount: boolean;
      uuid?: string;
    };
  };
}

export const getB2BQuoteDetail = (data: { id: number; date: string; uuid?: string }) =>
  B3Request.graphqlB2B({
    query: getQuoteInfo(data),
  });

export const getBcQuoteDetail = (data: { id: number; date: string; uuid?: string }) =>
  B3Request.graphqlB2B({
    query: getQuoteInfo(data),
  });

export const exportQuotePdf = (data: {
  quoteId: number;
  createdAt: number;
  isPreview: boolean;
  lang: string;
}) =>
  B3Request.graphqlB2B({
    query: getExportQuotePdfQuery(data),
  });

export const quoteCheckout = (data: { id: number }) =>
  B3Request.graphqlB2B({
    query: getQuoteCheckoutQuery(data),
  });

export const quoteDetailAttachFileCreate = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: quoteAttachFileCreate(data),
  });

export const quoteDetailAttachFileDelete = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: quoteAttachFileDelete(data),
  });

export const getBCStorefrontProductSettings = () =>
  B3Request.graphqlB2B({
    query: getStorefrontProductSettings,
    variables: { storeHash, channelId },
  });

export interface QuoteExtraFieldsConfig {
  data: {
    quoteExtraFieldsConfig: unknown[];
  };
}

export const getQuoteExtraFieldsConfig = (): Promise<QuoteExtraFieldsType> =>
  B3Request.graphqlB2B({
    query: getQuoteExtraFields,
    variables: { storeHash, channelId },
  });
