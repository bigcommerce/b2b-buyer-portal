export default /* GraphQL */ `
  enum InvoiceStatus {
    OPEN
    PAID
    OVERDUE
    CANCELLED
  }

  input InvoiceDateRangeFilterInput {
    from: DateTime
    to: DateTime
  }

  input InvoiceFiltersInput {
    search: String
    dateRange: InvoiceDateRangeFilterInput
    status: InvoiceStatus
  }

  enum InvoicesSortInput {
    INVOICE_NUMBER_A_TO_Z
    INVOICE_NUMBER_Z_TO_A
    ORDER_ID_A_TO_Z
    ORDER_ID_Z_TO_A
    CREATED_AT_NEWEST
    CREATED_AT_OLDEST
    DUE_DATE_NEWEST
    DUE_DATE_OLDEST
    ORIGINAL_BALANCE_HIGHEST
    ORIGINAL_BALANCE_LOWEST
    OPEN_BALANCE_HIGHEST
    OPEN_BALANCE_LOWEST
  }

  type CreateCartFromInvoiceError implements Error {
    message: String!
  }

  input CreateCartFromInvoiceInput {
    invoices: [InvoicePaymentInput!]!
  }

  type CartCreateResult {
    cart: Cart
    errors: [CreateCartFromInvoiceError!]!
  }

  type GenerateInvoicePdfError implements Error {
    message: String!
  }

  input GenerateInvoicePdfInput {
    invoiceId: ID!
  }

  type GenerateInvoicePdfResult {
    url: String
    errors: [GenerateInvoicePdfError!]!
  }

  type InvoiceBalances {
    open: Money!
    original: Money!
  }

  type Invoice {
    id: ID!
    invoiceNumber: String!
    createdAt: DateTime!
    dueDate: DateTime!
    balance: InvoiceBalances!
    status: InvoiceStatus!
    order: Order!
    company: Company!
  }

  type InvoiceEdge {
    node: Invoice!
    cursor: String!
  }

  type InvoiceConnection {
    edges: [InvoiceEdge!]!
    pageInfo: PageInfo!
    collectionInfo: CollectionInfo!
  }

  input ExportInvoicesAsCSVSearchInput {
    filters: InvoiceFiltersInput
    sortBy: InvoicesSortInput
    before: String
    after: String
    first: Int
    last: Int
  }

  input ExportInvoicesAsCSVByIdInput {
    invoicesIds: [ID!]!
  }

  type ExportInvoicesAsCSVResult {
    url: String
    errors: [Error!]!
  }

  type InvoiceTotals {
    open: Money!
    overdue: Money!
  }

  extend type Company {
    invoiceTotals: InvoiceTotals!
    invoicesByIds(invoiceIds: [ID!]!): [Invoice!]!
    invoices(
      filters: InvoiceFiltersInput
      sortBy: InvoicesSortInput
      before: String
      after: String
      first: Int
      last: Int
    ): InvoiceConnection!
  }

  input InvoicePaymentInput {
    id: ID!
    # If no amount is specified, the whole invoice amount will be used
    amountToPay: Float
  }

  type InvoiceMutations {
    createCartFromInvoices(input: CreateCartFromInvoiceInput!): CartCreateResult!
    generateInvoicePdf(input: GenerateInvoicePdfInput!): GenerateInvoicePdfResult!
    exportAsCSVFromSearch(
      input: ExportInvoicesAsCSVSearchInput!
    ): ExportInvoicesAsCSVResult!
    exportAsCSVByIds(input: ExportInvoicesAsCSVByIdInput!): ExportInvoicesAsCSVResult!
  }

  type ReceiptLineSet {
    id: ID!
    invoiceNumber: ID!
    amount: Money!
  }

  type Receipt {
    paymentId: ID!
    createdAt: DateTime!
    transactionType: String
    paymentType: String
    totalAmount: Money!
    referenceNumber: String
    receiptLineSet: [ReceiptLineSet!]!
  }

  extend type Query {
    invoice(invoiceId: ID!): Invoice!
    receipt(receiptId: ID!): Receipt!
  }

  extend type Mutation {
    invoice: InvoiceMutations!
  }
`
