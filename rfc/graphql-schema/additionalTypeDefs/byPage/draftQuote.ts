export default /* GraphQL */ `
  type SalesRep implements Node {
    id: ID!
    email: String!
  }

  # CartSelectedOption clone STARTS
  # Should we have an interface behind these?
  # Or is this coincidental duplication?
  # Can we imagine adding items to a cart and a draft quote diverging for business reasons?
  interface QuoteSelectedOption {
    entityId: Int!
    name: String!
  }

  type QuoteSelectedCheckboxOption implements QuoteSelectedOption {
    entityId: Int!
    name: String!
    value: String!
    valueEntityId: Int!
  }

  type QuoteSelectedDateFieldOption implements QuoteSelectedOption {
    entityId: Int!
    name: String!
    date: DateTimeExtended!
  }

  type QuoteSelectedFileUploadOption implements QuoteSelectedOption {
    entityId: Int!
    name: String!
    fileName: String!
  }

  type QuoteSelectedMultiLineTextFieldOption implements QuoteSelectedOption {
    entityId: Int!
    name: String!
    text: String!
  }

  type QuoteSelectedMultipleChoiceOption implements QuoteSelectedOption {
    entityId: Int!
    name: String!
    value: String!
    valueEntityId: Int!
  }

  type QuoteSelectedNumberFieldOption implements QuoteSelectedOption {
    entityId: Int!
    name: String!
    number: Float!
  }

  type QuoteSelectedTextFieldOption {
    entityId: Int!
    name: String!
    text: String!
  }
  # CartSelectedOption clone ENDS

  # could this reuse QuotePhysicalItem (or an interface that backs both)?
  type QuoteLineItem implements Node {
    id: ID!
    configuredProductId: ID!
    selectedOptions: [QuoteSelectedOption!]!
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

  # this is quite different from QuoteLineItems
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

  enum QuoteStatus {
    DRAFT
    OPEN
    ORDERED
    EXPIRED
  }

  # at this point the differences between draft/normal are:
  # - no expiration for draft
  # - salesRep MIGHT be N/A for draft
  # - mutation: drafts can have items added and removed
  # - mutation: open quotes can be turned into a cart
  # which seem small enough to go for optional
  # over separate types and a union
  type Quote implements Node {
    id: ID!
    status: QuoteStatus!
    createdBy: Customer!
    reference: String
    ccEmails: [String!]
    subTotal: Money!
    taxEstimate: Money!
    shippingCost: Money!
    totalIncTax: Money!
    createdAt: DateTime!
    updatedAt: DateTime!
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

  # CartSelectedOptionsInput clone STARTS
  # Should we have an interface behind these?
  # Or is this coincidental duplication?
  # Can we imagine adding items to a cart and a draft quote diverging for business reasons?

  input QuoteSelectedCheckboxOptionInput {
    optionEntityId: ID!
    optionValueEntityId: ID!
  }

  input QuoteSelectedDateFieldOptionInput {
    optionEntityId: ID!
    date: DateTime!
  }

  input QuoteSelectedMultiLineTextFieldOptionInput {
    optionEntityId: ID!
    text: String!
  }

  input QuoteSelectedMultipleChoiceOptionInput {
    optionEntityId: ID!
    optionValueEntityId: ID!
  }

  input QuoteSelectedNumberFieldOptionInput {
    optionEntityId: ID!
    number: Float!
  }

  input QuoteSelectedTextFieldOptionInput {
    optionEntityId: ID!
    text: String!
  }

  input QuoteSelectedOptionsInput {
    checkboxes: [QuoteSelectedCheckboxOptionInput!]
    dateFields: [QuoteSelectedDateFieldOptionInput!]
    multiLineTextFields: [QuoteSelectedMultiLineTextFieldOptionInput!]
    multipleChoices: [QuoteSelectedMultipleChoiceOptionInput!]
    numberFields: [QuoteSelectedNumberFieldOptionInput!]
    textFields: [QuoteSelectedTextFieldOptionInput!]
  }

  # CartSelectedOptionsInput clone ENDS

  input QuoteLineItemInput {
    quantity: Int!
    productEntityId: ID!
    variantEntityId: ID
    selectedOptions: QuoteSelectedOptionsInput
  }

  input AddQuoteLineItemsInput {
    quoteId: ID!
    lineItems: [QuoteLineItemInput!]!
    # AddCartLineItemsDataInput has giftCertificates
    # Would a B2B seller ever do giftCertificates?
  }

  type AddQuoteLineItemsResult {
    quote: Quote
    # AddCartLineItemsResult does not model any errors
    # But surely there are some business rules that could prevent an addition here?
    # We would need at least one for a "It is only possible to add items to a draft quote" error
    errors: [AddQuoteLineItemsError!]!
  }

  # Placeholder for real domain errors
  type SomeAddQuoteLineItemsError implements Error {
    message: String!
  }

  # Placeholder for real domain errors
  type AnotherAddQuoteLineItemsError implements Error {
    message: String!
  }

  union AddQuoteLineItemsError =
      SomeAddQuoteLineItemsError
    | AnotherAddQuoteLineItemsError

  type QuoteMutations {
    addLineItems(input: AddQuoteLineItemsInput): AddQuoteLineItemsResult!
  }

  input UpdateQuoteLineItemInput {
    quoteId: ID!
    lineItemId: ID!
    lineItem: QuoteLineItemInput!
  }

  type UpdateQuoteLineItemResult {
    quote: Quote
    # UpdateCartLineItemsResult does not model any errors
    # But surely there are some business rules that could prevent an addition here?
    # We would need at least one for a "It is only possible to add items to a draft quote" error
    errors: [UpdateQuoteLineItemError!]!
  }

  # Placeholder for real domain errors
  type SomeUpdateQuoteLineItemError implements Error {
    message: String!
  }

  # Placeholder for real domain errors
  type AnotherUpdateQuoteLineItemError implements Error {
    message: String!
  }

  union UpdateQuoteLineItemError =
      SomeUpdateQuoteLineItemError
    | AnotherUpdateQuoteLineItemError

  extend type QuoteMutations {
    updateLineItem(input: UpdateQuoteLineItemInput!): UpdateQuoteLineItemResult
  }

  input DeleteQuoteLineItemInput {
    quoteId: ID!
    lineItemId: ID!
  }

  type DeleteQuoteLineItemResult {
    deletedLineItemEntityId: ID
    quote: Quote
  }

  extend type QuoteMutations {
    deleteLineItem(input: DeleteQuoteLineItemInput): DeleteQuoteLineItemResult
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

  input AddQuoteMessageInput {
    quoteId: ID!
    message: String!
  }

  extend type QuoteMutations {
    addMessage(message: AddQuoteMessageInput!): AddMessageResult!
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

  input AddQuoteAttachmentInput {
    quoteId: ID!
    attachmentId: ID!
  }

  extend type QuoteMutations {
    addAttachment(input: AddQuoteAttachmentInput): AddAttachmentResult!
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

  input RemoveQuoteAttachmentInput {
    quoteId: ID!
    attachmentId: ID!
  }

  extend type QuoteMutations {
    removeAttachment(
      input: RemoveQuoteAttachmentInput!
    ): RemoveAttachmentResult!
  }

  extend type Mutation {
    quote: QuoteMutations!
  }
`
