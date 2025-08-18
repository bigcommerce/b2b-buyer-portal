export default /* GraphQL */ `
  type SalesRep implements Node {
    id: ID!
    email: String!
  }

  enum QuoteStatus {
    DRAFT
    OPEN
    ORDERED
    EXPIRED
  }

  # could this reuse CartPhysicalItem (or an interface that backs both)?
  type QuoteLineItem implements Node {
    id: ID!
    sku: String
    name: String!
    quantity: Int!
    price: Money!
    total: Money!
    image: Image
  }

  type QuoteLineItemEdge {
    node: QuoteLineItem!
    cursor: String!
  }

  # this is quite different from CartLineItems
  # which is split by digital/physical/giftCertificates
  # and does not model pagination at all
  type QuoteLineItemsConnection {
    pageInfo: PageInfo!
    edges: [QuoteLineItemEdge!]
  }

  union MessageAuthor = Customer | SalesRep

  type QuoteMessage {
    sentAt: DateTime!
    content: String!
    author: MessageAuthor!
  }

  type QuoteMessageEdge {
    node: QuoteMessage!
    cursor: String!
  }

  type QuoteMessagesConnection {
    pageInfo: PageInfo!
    edges: [QuoteMessageEdge!]
  }

  union AttachmentAuthor = Customer | SalesRep

  type QuoteAttachment implements Node {
    id: ID!
    name: String!
    url: String!
    uploadedBy: AttachmentAuthor!
  }

  type QuoteAttachmentEdge {
    node: QuoteAttachment!
    cursor: String!
  }

  type QuoteAttachmentsConnection {
    pageInfo: PageInfo!
    edges: [QuoteAttachmentEdge!]
  }

  # at this point the differences between draft/normal are:
  # - no expiration for draft
  # - salesRep MIGHT be N/A for draft
  # which seem small enough to go for optional
  # over separate types and a union
  type Quote implements Node {
    id: ID!
    status: QuoteStatus!
    createdBy: Customer!
    title: String
    reference: String
    ccEmails: [String!]
    subTotal: Money!
    taxEstimate: Money!
    # optional "shippingCost" means no shipping address has been added
    # but do we need to worry about digital product only quotes?
    shippingCost: Money
    totalIncTax: Money!
    createdBy: Customer!
    createdAt: DateTime!
    lastUpdated: DateTime!
    expirationDate: DateTime
    salesRep: SalesRep
    billingAddress: CompanyAddress
    # how does a singular shipping address gel with (potentially) multiple consignments on an order?
    shippingAddress: CustomerAddress
    lineItems(
      before: String
      after: String
      first: Int
      last: Int
    ): QuoteLineItemsConnection!
    # we could model messages as a 'Conversation' entity instead
    messages(
      before: String
      after: String
      first: Int
      last: Int
    ): QuoteMessagesConnection!
    attachments(
      before: String
      after: String
      first: Int
      last: Int
    ): QuoteAttachmentsConnection!
  }

  extend type Query {
    quote(id: ID!): Quote
  }

  # Placeholder for real domain errors
  type SomeAddMessageResultError implements Error {
    message: String!
  }

  # Placeholder for real domain errors
  type AnotherAddMessageResultError implements Error {
    message: String!
  }

  union AddMessageResultError =
      SomeAddMessageResultError
    | AnotherAddMessageResultError

  type AddMessageResult {
    errors: [AddMessageResultError!]!
    message: QuoteMessage
  }

  # Placeholder for real domain errors
  type SomeAddAttachmentResultError implements Error {
    message: String!
  }

  # Placeholder for real domain errors
  type AnotherAddAttachmentResultError implements Error {
    message: String!
  }

  union AddAttachmentResultError =
      SomeAddAttachmentResultError
    | AnotherAddAttachmentResultError

  type AddAttachmentResult {
    errors: [AddAttachmentResultError!]!
    attachment: QuoteAttachment
  }

  # Placeholder for real domain errors
  type SomeRemoveAttachmentResultError implements Error {
    message: String!
  }

  # Placeholder for real domain errors
  type AnotherRemoveAttachmentResultError implements Error {
    message: String!
  }

  union RemoveAttachmentResultError =
      SomeRemoveAttachmentResultError
    | AnotherRemoveAttachmentResultError

  type RemoveAttachmentResult {
    errors: [RemoveAttachmentResultError!]!
  }

  # Placeholder for real domain errors
  type SomeCreatePDFResultError implements Error {
    message: String!
  }

  # Placeholder for real domain errors
  type AnotherCreatePDFResultError implements Error {
    message: String!
  }

  union CreatePDFResultError =
      SomeCreatePDFResultError
    | AnotherCreatePDFResultError

  interface QuotePDF {
    url: String!
  }

  type CreatePDFResult {
    errors: [CreatePDFResultError!]!
    pdf: QuotePDF
  }

  # Placeholder for real domain errors
  type SomeCreateCartError implements Error {
    message: String!
  }

  # Placeholder for real domain errors
  type AnotherCreateCartError implements Error {
    message: String!
  }

  union CreateCartError = SomeCreateCartError | AnotherCreateCartError

  interface QuotePDF {
    url: String!
  }

  interface CartFromQuoteDetails {
    cartId: ID!
    cartUrl: String!
    checkoutUrl: String!
  }

  type CreateCart {
    errors: [CreateCartError!]!
    cartDetails: CartFromQuoteDetails
  }

  type QuoteMutations {
    addMessage(message: String!): AddMessageResult!
    addAttachment(id: ID!): AddAttachmentResult!
    removeAttachment(id: ID!): RemoveAttachmentResult!
    createPDF: CreatePDFResult!
    createCart: CreateCartResult!
  }

  extend type Mutation {
    quote(id: ID!): QuoteMutations
  }
`
