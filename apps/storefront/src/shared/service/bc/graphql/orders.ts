/**
 * GraphQL Storefront API: Orders (Unified B2B + BC)
 * https://developer.bigcommerce.com/docs/storefront/graphql/orders
 *
 * Replaces the older B2B-specific orders API (b2b/graphql/orders.ts).
 * Follows the same migration pattern as register.ts → company.ts.
 * @see https://developer.bigcommerce.com/docs/storefront/graphql/orders
 */

import { platform } from '@/utils/basicConfig';

import B3Request from '../../request/b3Fetch';

// ---------------------------------------------------------------------------
// Shared primitive types
// ---------------------------------------------------------------------------

export interface Money {
  currencyCode: string;
  value: number;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string;
  endCursor: string;
}

export interface CollectionInfo {
  totalItems: number;
}

/** BC Storefront GraphQL DateTimeExtended type. */
export interface DateTimeExtended {
  utc: string;
}

// ---------------------------------------------------------------------------
// Order status
// ---------------------------------------------------------------------------

export interface OrderStatus {
  value: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Address
// ---------------------------------------------------------------------------

export interface OrderAddress {
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
  countryCode: string;
  phone: string;
  email: string;
}

// ---------------------------------------------------------------------------
// Line items & consignments
// ---------------------------------------------------------------------------

export interface OrderProductOption {
  name: string;
  value: string;
}

export interface OrderLineItem {
  entityId: number;
  brand: string;
  name: string;
  quantity: number;
  productOptions: OrderProductOption[];
  subTotalListPrice: Money;
}

export interface OrderShipmentTracking {
  number: string;
  url: string;
}

export interface OrderShipment {
  entityId: number;
  shippedAt: string;
  shippingMethodName: string;
  shippingProviderName: string;
  tracking: OrderShipmentTracking | null;
}

export interface ShippingConsignment {
  entityId: number;
  shippingAddress: OrderAddress;
  shippingCost: Money;
  lineItems: { edges: Array<{ node: OrderLineItem }> };
  shipments: { edges: Array<{ node: OrderShipment }> };
}

export interface OrderConsignments {
  shipping: { edges: Array<{ cursor: string; node: ShippingConsignment }> };
}

// ---------------------------------------------------------------------------
// Financial types
// ---------------------------------------------------------------------------

export interface OrderDiscount {
  couponCode: string;
  discountedAmount: Money;
}

export interface OrderTax {
  name: string;
  amount: Money;
}

// ---------------------------------------------------------------------------
// B2B extension types
// ---------------------------------------------------------------------------

export interface OrderCompany {
  entityId: number;
  name: string;
}

export interface OrderPlacedBy {
  entityId: number;
  firstName: string;
  lastName: string;
  email: string;
}

export enum OrderHistoryEventType {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_UPDATED = 'ORDER_UPDATED',
}

export interface OrderHistoryEvent {
  id: string;
  eventType: OrderHistoryEventType;
  status: string;
  source: string | null;
  createdBy: OrderPlacedBy | null;
  createdAt: string;
}

export interface OrderQuote {
  id: string;
}

export interface OrderInvoice {
  id: string;
}

export interface ExtraFieldValue {
  name: string;
  value: string;
}

// ---------------------------------------------------------------------------
// Main Order type (BC base + B2B extensions)
// ---------------------------------------------------------------------------

export interface Order {
  entityId: number;
  orderedAt: DateTimeExtended;
  updatedAt: DateTimeExtended;
  status: OrderStatus;
  billingAddress: OrderAddress;

  // Financial
  subTotal: Money;
  discountedSubTotal: Money;
  shippingCostTotal: Money;
  handlingCostTotal: Money;
  wrappingCostTotal: Money;
  taxTotal: Money;
  totalIncTax: Money;
  isTaxIncluded: boolean;
  taxes: OrderTax[];
  discounts: OrderDiscount[];

  // Content
  customerMessage: string;
  totalProductQuantity: number;
  consignments: OrderConsignments;

  // B2B extensions
  reference: string | null;
  company: OrderCompany | null;
  placedBy: OrderPlacedBy | null;
  history: OrderHistoryEvent[];
  quote: OrderQuote | null;
  invoice: OrderInvoice | null;
  extraFields: ExtraFieldValue[];
}

// ---------------------------------------------------------------------------
// Connection types
// ---------------------------------------------------------------------------

export interface CompanyOrdersEdge {
  node: Order;
  cursor: string;
}

export interface CompanyOrdersConnection {
  edges: CompanyOrdersEdge[];
  pageInfo: PageInfo;
  collectionInfo: CollectionInfo;
}

export interface CompanyCustomerEdge {
  node: OrderPlacedBy;
  cursor: string;
}

export interface CompanyCustomerConnection {
  edges: CompanyCustomerEdge[];
  pageInfo: PageInfo;
}

// ---------------------------------------------------------------------------
// Filter & sort types
// ---------------------------------------------------------------------------

export enum OrdersSortInput {
  ID_A_TO_Z = 'ID_A_TO_Z',
  ID_Z_TO_A = 'ID_Z_TO_A',
  REFERENCE_A_TO_Z = 'REFERENCE_A_TO_Z',
  REFERENCE_Z_TO_A = 'REFERENCE_Z_TO_A',
  HIGHEST_TOTAL_INC_TAX = 'HIGHEST_TOTAL_INC_TAX',
  LOWEST_TOTAL_INC_TAX = 'LOWEST_TOTAL_INC_TAX',
  STATUS_A_TO_Z = 'STATUS_A_TO_Z',
  STATUS_Z_TO_A = 'STATUS_Z_TO_A',
  CREATED_AT_NEWEST = 'CREATED_AT_NEWEST',
  CREATED_AT_OLDEST = 'CREATED_AT_OLDEST',
}

export interface OrderDateRangeFilterInput {
  from: string;
  to?: string;
}

export interface CompanyOrdersFiltersInput {
  search?: string;
  dateRange?: OrderDateRangeFilterInput;
  status?: string[];
  customerId?: number[];
  companyIds?: string[];
}

export interface CustomerOrdersFiltersInput {
  search?: string;
  companyName?: string;
  companyIds?: string[];
}

export interface CustomerWithOrdersFiltersInput {
  companyIds?: string[];
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface GetCompanyOrdersResponse {
  data?: {
    customer?: {
      company?: {
        orders?: CompanyOrdersConnection;
      };
    };
  };
  errors?: Array<{ message: string }>;
}

export interface GetCustomerOrdersResponse {
  data?: {
    customer?: {
      orders?: {
        edges: Array<{ node: Order }>;
        pageInfo: PageInfo;
        collectionInfo: CollectionInfo;
      };
    };
  };
  errors?: Array<{ message: string }>;
}

export interface GetOrderDetailResponse {
  data?: {
    site?: {
      order?: Order;
    };
  };
  errors?: Array<{ message: string }>;
}

export interface GetCustomersWithOrdersResponse {
  data?: {
    customer?: {
      company?: {
        customersWithOrders?: CompanyCustomerConnection;
      };
    };
  };
  errors?: Array<{ message: string }>;
}

// ---------------------------------------------------------------------------
// Fragments
// ---------------------------------------------------------------------------

const moneyFields = `currencyCode
  value`;

const orderStatusFields = `status {
    value
    label
  }`;

const orderAddressFields = `firstName
    lastName
    company
    address1
    address2
    city
    stateOrProvince
    postalCode
    country
    countryCode
    phone
    email`;

const orderLineItemFields = `entityId
      brand
      name
      quantity
      productOptions {
        name
        value
      }
      subTotalListPrice {
        ${moneyFields}
      }`;

const orderShipmentFields = `entityId
      shippedAt
      shippingMethodName
      shippingProviderName
      tracking {
        ... on OrderShipmentNumberAndUrlTracking {
          number
          url
        }
        ... on OrderShipmentNumberOnlyTracking {
          number
        }
        ... on OrderShipmentUrlOnlyTracking {
          url
        }
      }`;

const orderConsignmentsFields = `consignments {
    shipping {
      edges {
        cursor
        node {
          entityId
          shippingAddress {
            ${orderAddressFields}
          }
          shippingCost {
            ${moneyFields}
          }
          lineItems {
            edges {
              node {
                ${orderLineItemFields}
              }
            }
          }
          shipments {
            edges {
              node {
                ${orderShipmentFields}
              }
            }
          }
        }
      }
    }
  }`;

const orderFinancialFields = `subTotal {
    ${moneyFields}
  }
  discountedSubTotal {
    ${moneyFields}
  }
  shippingCostTotal {
    ${moneyFields}
  }
  handlingCostTotal {
    ${moneyFields}
  }
  wrappingCostTotal {
    ${moneyFields}
  }
  taxTotal {
    ${moneyFields}
  }
  totalIncTax {
    ${moneyFields}
  }
  isTaxIncluded
  taxes {
    name
    amount {
      ${moneyFields}
    }
  }
  discounts {
    couponCode
    discountedAmount {
      ${moneyFields}
    }
  }`;

const orderB2BFields = `reference
  company {
    entityId
    name
  }
  placedBy {
    entityId
    firstName
    lastName
    email
  }
  history {
    id
    eventType
    status
    source
    createdBy {
      entityId
      firstName
      lastName
      email
    }
    createdAt
  }
  quote {
    id
  }
  invoice {
    id
  }
  extraFields {
    name
    value
  }`;

/** Lightweight fields for order list views. */
export const orderListNodeFields = `entityId
  orderedAt {
    utc
  }
  ${orderStatusFields}
  totalIncTax {
    ${moneyFields}
  }
  reference
  company {
    entityId
    name
  }
  placedBy {
    entityId
    firstName
    lastName
  }`;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Company-scoped order list (B2B). Replaces old `allOrders`. */
export const GET_COMPANY_ORDERS = `query GetCompanyOrders(
  $filters: CompanyOrdersFiltersInput
  $sortBy: OrdersSortInput
  $first: Int
  $after: String
  $last: Int
  $before: String
) {
  customer {
    company {
      orders(
        filters: $filters
        sortBy: $sortBy
        first: $first
        after: $after
        last: $last
        before: $before
      ) {
        edges {
          node {
            ${orderListNodeFields}
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        collectionInfo {
          totalItems
        }
      }
    }
  }
}`;

/** Personal order list (customer-scoped). Replaces old `customerOrders`. */
export const GET_CUSTOMER_ORDERS = `query GetCustomerOrders(
  $filters: OrdersFiltersInput
  $first: Int
  $after: String
) {
  customer {
    orders(
      filters: $filters
      first: $first
      after: $after
    ) {
      edges {
        node {
          ${orderListNodeFields}
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      collectionInfo {
        totalItems
      }
    }
  }
}`;

/** Single order detail. Replaces old `order` / `customerOrder`. */
export const GET_ORDER_DETAIL = `query GetOrderDetail($entityId: Int!) {
  site {
    order(filter: { entityId: $entityId }) {
      entityId
      orderedAt {
        utc
      }
      updatedAt {
        utc
      }
      ${orderStatusFields}
      billingAddress {
        ${orderAddressFields}
      }
      ${orderFinancialFields}
      customerMessage
      totalProductQuantity
      ${orderConsignmentsFields}
      ${orderB2BFields}
    }
  }
}`;

/** Customers who have placed orders within a company. Used for "Placed By" filter dropdown. */
export const GET_CUSTOMERS_WITH_ORDERS = `query GetCustomersWithOrders(
  $filters: CustomerWithOrdersFiltersInput
  $first: Int
  $after: String
) {
  customer {
    company {
      customersWithOrders(
        filters: $filters
        first: $first
        after: $after
      ) {
        edges {
          node {
            entityId
            firstName
            lastName
            email
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  }
}`;

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

function graphqlRequest<T>(data: { query: string; variables?: object }): Promise<T> {
  return platform === 'bigcommerce'
    ? B3Request.graphqlBC<T>(data)
    : B3Request.graphqlBCProxy<T>(data);
}

/**
 * Fetch company-scoped orders (B2B).
 * Replaces old `getB2BAllOrders`.
 * @see https://developer.bigcommerce.com/docs/storefront/graphql/orders
 */
export async function getCompanyOrders(variables: {
  filters?: CompanyOrdersFiltersInput;
  sortBy?: OrdersSortInput;
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}): Promise<GetCompanyOrdersResponse> {
  return graphqlRequest<GetCompanyOrdersResponse>({
    query: GET_COMPANY_ORDERS,
    variables,
  });
}

/**
 * Fetch customer-scoped orders (personal / B2C).
 * Replaces old `getBCAllOrders`.
 * @see https://developer.bigcommerce.com/docs/storefront/graphql/orders
 */
export async function getCustomerOrders(variables: {
  filters?: CustomerOrdersFiltersInput;
  first?: number;
  after?: string;
}): Promise<GetCustomerOrdersResponse> {
  return graphqlRequest<GetCustomerOrdersResponse>({
    query: GET_CUSTOMER_ORDERS,
    variables,
  });
}

/**
 * Fetch a single order detail by entityId.
 * Replaces old `getB2BOrderDetails` / `getBCOrderDetails`.
 * @see https://developer.bigcommerce.com/docs/storefront/graphql/orders
 */
export async function getOrderDetail(entityId: number): Promise<GetOrderDetailResponse> {
  return graphqlRequest<GetOrderDetailResponse>({
    query: GET_ORDER_DETAIL,
    variables: { entityId },
  });
}

/**
 * Fetch customers who have placed orders within a company.
 * Used for "Placed By" filter dropdown.
 */
export async function getCustomersWithOrders(variables: {
  filters?: CustomerWithOrdersFiltersInput;
  first?: number;
  after?: string;
}): Promise<GetCustomersWithOrdersResponse> {
  return graphqlRequest<GetCustomersWithOrdersResponse>({
    query: GET_CUSTOMERS_WITH_ORDERS,
    variables,
  });
}
