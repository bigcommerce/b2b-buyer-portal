import { convertArrayToGraphql } from '../../../../utils/graphqlDataConvert';
import B3Request from '../../request/b3Fetch';

const invoiceList = (data: CustomFieldItems) => `
query GetInvoices {
  invoices (
    search: "${data.q || ''}"
    first: ${data.first}
    offset: ${data.offset} 
    ${data.status ? `status: ${convertArrayToGraphql(data.status ? [data.status] : [])}` : ''}
    ${data.beginDateAt ? `beginDateAt: "${data.beginDateAt}"` : ''}
    ${data.endDateAt ? `endDateAt: "${data.endDateAt}"` : ''}
    orderBy: "${data.orderBy}"
    ${data.beginDueDateAt ? `beginDueDateAt: "${data.beginDueDateAt}"` : ''}
    ${data.endDueDateAt ? `endDueDateAt: "${data.endDueDateAt}"` : ''}
    ${data.companyIds ? `companyIds: ${convertArrayToGraphql(data.companyIds || [])}` : ''}
  ){
    totalCount,
    pageInfo{
      hasNextPage,
      hasPreviousPage,
    },
    edges{
      node {
        id,
        createdAt,
        updatedAt,
        storeHash,
        customerId,
        externalId,
        invoiceNumber,
        dueDate,
        orderNumber,
        purchaseOrderNumber,
        notAllowedPay,
        details,
        status,
        pendingPaymentCount,
        purchaseOrderNumber,
        openBalance {
          code,
          value,
        },
        originalBalance {
          code,
          value,
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
          bcId,
        },
        orderUserId,
      }
    }
  }
}`;

const invoiceStats = (status: number | string, decimalPlaces: number, companyIds: number[]) => `
query GetInvoiceStats {
  invoiceStats (
    ${status === '' ? '' : `status: ${status},`}
    decimalPlaces: ${decimalPlaces}
    ${companyIds.length ? `companyIds: ${convertArrayToGraphql(companyIds || [])}` : ''}
  ){
    totalBalance,
    overDueBalance,
  }
}`;

const getInvoiceDownloadPDF = (invoiceId: number, isPayNow: boolean) => `
mutation GetInvoicePDFUrl {
  invoicePdf (
    invoiceId: ${invoiceId}
    ${isPayNow ? `isPayNow: ${isPayNow}` : ''}
  ){
    url,
  }
}`;

const invoiceCreateBcCart = (data: any) => `
mutation CreateCart {
  invoiceCreateBcCart (
    bcCartData: {
      lineItems: ${convertArrayToGraphql(data.lineItems)},
      currency: "${data.currency}"
      details: {
        memo: ""
      }
    }
  ) {
    result {
      checkoutUrl
      cartId
    }
  }
}`;

const receiptLine = (id: number) => `
query GetInvoicePaymentHistory {
  allReceiptLines (
    invoiceId: "${id}"
    first: 50
    offset: 0
  ) {
    edges {
      node {
        id
        paymentType
        invoiceId
        amount
        transactionType
        referenceNumber
        createdAt
      }
    }
    totalCount
  }
}`;

const invoiceDetail = (invoiceId: number) => `
query GetInvoiceDetails {
  invoice (
    invoiceId: ${invoiceId}
  ) {
    id,
    createdAt,
    updatedAt,
    storeHash,
    customerId,
    externalId,
    invoiceNumber,
    dueDate,
    orderNumber,
    purchaseOrderNumber,
    notAllowedPay,
    details,
    status,
    pendingPaymentCount,
    purchaseOrderNumber,
    openBalance {
      code,
      value,
    },
    originalBalance {
      code,
      value,
    },
  }
}`;

const invoiceReceipt = (id: number) => `
query GetInvoiceReceipt {
  receipt (
    id: ${id}
  ) {
    id,
    createdAt,
    updatedAt,
    storeHash,
    customerId,
    externalId,
    externalCustomerId,
    totalCode,
    totalAmount,
    payerName,
    payerCustomerId,
    details,
    paymentId,
    transactionType,
    paymentType,
    referenceNumber,
    receiptLineSet {
      edges {
        node {
          id,
          createdAt,
          updatedAt,
          storeHash,
          customerId,
          externalId,
          externalCustomerId,
          receiptId,
          invoiceId,
          amountCode,
          amount,
          paymentStatus,
          paymentType,
          invoiceNumber,
          paymentId,
          transactionType,
          referenceNumber,
        }
      }
    }
  }
}`;

const exportInvoices = `
mutation ExportInvoicesAsCSV ($invoiceFilterData: InvoiceFilterDataType!, $lang: String!) {
  invoicesExport (
    invoiceFilterData: $invoiceFilterData,
    lang: $lang,
  ) {
    url
  }
}`;

export const getInvoiceList = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: invoiceList(data),
  });

export const invoiceDownloadPDF = (invoiceId: number, isPayNow: boolean) =>
  B3Request.graphqlB2B({
    query: getInvoiceDownloadPDF(invoiceId, isPayNow),
  });

export const getInvoiceCheckoutUrl = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: invoiceCreateBcCart(data),
  });

export const getInvoicePaymentHistory = (id: number) =>
  B3Request.graphqlB2B({
    query: receiptLine(id),
  });

export const getInvoiceDetail = (id: number) =>
  B3Request.graphqlB2B({
    query: invoiceDetail(id),
  });

export const getInvoicePaymentInfo = (id: number) =>
  B3Request.graphqlB2B({
    query: invoiceReceipt(id),
  });

export const exportInvoicesAsCSV = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: exportInvoices,
    variables: data,
  });

export const getInvoiceStats = (
  status: number | string,
  decimalPlaces: number,
  companyIds: number[],
) =>
  B3Request.graphqlB2B({
    query: invoiceStats(status, decimalPlaces, companyIds),
  });
