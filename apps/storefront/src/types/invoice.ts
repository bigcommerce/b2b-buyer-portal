export interface CompanyInfoTypes {
  companyId: string;
  companyName: string;
  companyAddress: string;
  companyCountry: string;
  companyState: string;
  companyCity: string;
  companyZipCode: string;
  phoneNumber: string;
  bcId: string;
}

export interface InvoiceList {
  id: string;
  createdAt: number;
  updatedAt: number;
  storeHash: string;
  customerId: string;
  externalId: null | string;
  invoiceNumber: string;
  dueDate: number;
  orderNumber: string;
  purchaseOrderNumber: string;
  notAllowedPay: number;
  details: InvoiceDetails;
  status: number;
  pendingPaymentCount: number;
  openBalance: OpenBalance;
  originalBalance: OpenBalance;
  orderUserId: number;
  companyInfo: CompanyInfoTypes;
  isCollapse?: boolean;
  disableCurrentCheckbox?: boolean;
  sortDirection?: string;
}

export interface InvoiceListNode {
  node: InvoiceList;
}

export interface BcCartData {
  lineItems: BcCartDataLineItem[];
  currency: string;
  details?: {
    memo: string;
  };
}

export interface BcCartDataLineItem {
  invoiceId: number;
  amount: string;
}

interface OpenBalance {
  code: string;
  value: string;
  originValue: string | number;
}

interface InvoiceDetails {
  type: string;
  header: InvoiceHeader;
  details: InvoiceAdditionalDetails;
}

interface InvoiceHeader {
  cost_lines: CostLine[];
  order_date: number;
  billing_address: Address;
  customer_fields: Record<string, any>;
  shipping_addresses: Address[];
}

interface CostLine {
  amount: Amount;
  description: string;
}

interface Amount {
  code: string;
  value: string;
}

interface Address {
  city: string;
  state: string;
  country: string;
  street_1: string;
  street_2: string;
  zip_code: string;
  last_name: string;
  first_name: string;
  custom_fields: Record<string, any>;
}

interface InvoiceAdditionalDetails {
  shipments: any[];
  line_items: LineItem[];
}

interface LineItem {
  sku: string;
  type: string;
  comments: string;
  quantity: number;
  unit_price: Amount;
  description: string;
  custom_fields: Record<string, any>;
  unit_discount: Amount;
}

export interface InvoiceSuccessData {
  id: string;
  createdAt: number;
  updatedAt: number;
  storeHash: string;
  customerId: number;
  externalId: null | string | number;
  externalCustomerId: null | string | number;
  totalCode: string;
  totalAmount: string;
  payerName: string;
  payerCustomerId: string;
  details: {
    paymentDetails: {
      memo: string;
      comment: string;
    };
  };
  paymentId: number;
  transactionType: string;
  paymentType: string;
  referenceNumber: string;
  receiptLineSet: {
    edges: ReceiptLineSet[];
  };
}

export interface ReceiptLineSet {
  node: {
    id: string;
    createdAt: number;
    updatedAt: number;
    storeHash: string;
    customerId: number;
    externalId: null | string | number;
    externalCustomerId: null | string | number;
    receiptId: number;
    invoiceId: number;
    amountCode: string;
    amount: {
      code: string;
      value: string;
    };
    paymentStatus: number;
    paymentType: string;
    invoiceNumber: string;
    paymentId: number;
    transactionType: string;
    referenceNumber: string;
  };
}
