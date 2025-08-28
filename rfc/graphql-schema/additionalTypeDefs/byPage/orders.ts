export default /* GraphQL */ `
  type ExtraFieldValue {
    name: String!
    value: String!
  }

  type OrderHistory {
    status: OrderStatus!
    createdAt: DateTime!
  }

  # This is a placeholder for Quote, it will be extended/overwritten in a different file.
  type Quote implements Node {
    id: ID!
  }

  extend type Order {
    history: [OrderHistory!]!
    reference: String # This is currently the 'poNumber' field
    company: Company
    quote: Quote
    invoice: Invoice
    extraFields: [ExtraFieldValue!]! # This is the read-only version of the extra fields submitted when placing the order
  }

  enum OrdersSortInput {
    # Should we make this redundant and always sort by CREATED_AT by default?
    ID_A_TO_Z
    ID_Z_TO_A
    REFERENCE_A_TO_Z
    REFERENCE_Z_TO_A
    HIGHEST_TOTAL_INC_TAX
    LOWEST_TOTAL_INC_TAX
    STATUS_A_TO_Z
    STATUS_Z_TO_A
    CREATED_AT_NEWEST
    CREATED_AT_OLDEST
  }

  input CompanyOrdersFiltersInput {
    search: String
    dateRange: OrderDateRangeFilterInput
    status: OrderStatusValue
    customerId: [Int!]
    companyIds: [ID!] # Used to further filter the orders by company, required for company hierarchy
  }

  extend input OrdersFiltersInput {
    search: String
    companyName: String
    companyIds: [ID!] # I need to confirm, but this looks required for company hierarchy
  }

  input CustomerWithOrdersFiltersInput {
    companyIds: [ID!] # Used to further filter the orders by company, required for company hierarchy
  }

  # For re-order/add to shopping list in the OrderDetails page, we'll rely on 'purchasedProducts' with a filter.
  # This should provide the configuredProductId(s) for all products in an order

  extend type Company {
    customersWithOrders(
      filters: CustomerWithOrdersFiltersInput
      sortBy: OrdersSortInput
      before: String
      after: String
      first: Int
      last: Int
    ): CustomerConnection
    orders(
      filters: CompanyOrdersFiltersInput
      sortBy: OrdersSortInput
      before: String
      after: String
      first: Int
      last: Int
    ): OrdersConnection!
  }
`
