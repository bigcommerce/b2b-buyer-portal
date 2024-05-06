import { convertArrayToGraphql } from '../../../../utils';
import B3Request from '../../request/b3Fetch';

const invoiceList = (data: CustomFieldItems) => `{
  invoices (
    search: "${data.q || ''}"
    first: ${data.first}
    offset: ${data.offset} 
    ${data?.status ? `status: ${convertArrayToGraphql(data.status ? [data.status] : [])}` : ''}
    ${data?.beginDateAt ? `beginDateAt: "${data.beginDateAt}"` : ''}
    ${data?.endDateAt ? `endDateAt: "${data.endDateAt}"` : ''}
    orderBy: "${data?.orderBy}"
    ${data?.beginDueDateAt ? `beginDueDateAt: "${data.beginDueDateAt}"` : ''}
    ${data?.endDueDateAt ? `endDueDateAt: "${data.endDueDateAt}"` : ''}
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
      }
    }
  }
}`;

const invoiceStats = (status: number | string) => `{
  invoiceStats (
    ${status === '' ? '' : `status: ${status},`}
  ){
    totalBalance,
    overDueBalance,
  }
}`;

const getInvoiceDownloadPDF = (invoiceId: number, isPayNow: boolean) => `mutation {
  invoicePdf (
    invoiceId: ${invoiceId}
    ${isPayNow ? `isPayNow: ${isPayNow}` : ''}
  ){
    url,
  }
}`;

const invoiceCreateBcCart = (data: any) => `mutation {
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

const receiptLine = (id: number) => `{
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

const invoiceDetail = (invoiceId: number) => `{
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

const invoiceReceipt = (id: number) => `{
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

const exportInvoices = (data: CustomFieldItems) => `mutation {
  invoicesExport (
    invoiceFilterData: {
      idIn: "${data?.invoiceNumber || ''}"
      orderBy: "${data?.orderBy || ''}"
      status: ${data?.status ? convertArrayToGraphql(data.status) : []}
      search: "${data?.search || ''}"
      ${data?.orderNumber ? `orderNumber: ${data.orderNumber}` : ''}
      ${data?.beginDateAt ? `beginDateAt: ${data.beginDateAt}` : ''}
      ${data?.endDateAt ? `endDateAt: ${data.endDateAt}` : ''}
    }
  ) {
    url
  }
}`;

export const getInvoiceList = (data: CustomFieldItems): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: invoiceList(data),
  });

export const invoiceDownloadPDF = (invoiceId: number, isPayNow: boolean): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: getInvoiceDownloadPDF(invoiceId, isPayNow),
  });

export const getInvoiceCheckoutUrl = (data: CustomFieldItems): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: invoiceCreateBcCart(data),
  });

export const getInvoicePaymentHistory = (id: number): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: receiptLine(id),
  });

export const getInvoiceDetail = (id: number): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: invoiceDetail(id),
  });

export const getInvoicePaymentInfo = (id: number): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: invoiceReceipt(id),
  });

export const exportInvoicesAsCSV = (data: CustomFieldItems): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: exportInvoices(data),
  });

export const getInvoiceStats = (status: number | string): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: invoiceStats(status),
  });
