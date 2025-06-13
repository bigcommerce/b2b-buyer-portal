export default /* GraphQL */ `
  type OrderHistory {
    status: OrderStatus!
    createdAt: DateTime!
  }

  extend type Order {
    history: [OrderHistory!]!
    poNumber: String
    company: Company
  }

  enum OrdersSortInput {
    # Should we make this redundant and always sort by CREATED_AT by default?
    ID_A_TO_Z
    ID_Z_TO_A
    PO_NUMBER_A_TO_Z
    PO_NUMBER_Z_TO_A
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
