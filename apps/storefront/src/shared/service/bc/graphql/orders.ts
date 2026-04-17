/**
 * Unified SF GQL Orders API (B2B + BC).
 *
 * Replaces b2b/graphql/orders.ts. Base SF GQL types live in ./base.ts.
 * B2B extension types mirror rfc/graphql-schema/additionalTypeDefs/byPage/orders.ts.
 *
 * @see https://docs.bigcommerce.com/developer/api-reference/graphql/storefront/queries/node#fields.body.Order
 */

import { platform } from '@/utils/basicConfig';

import B3Request from '../../request/b3Fetch';

import type { CollectionInfo, DateTimeExtended, Money, PageInfo } from './base';

export type { CollectionInfo, DateTimeExtended, Money, PageInfo } from './base';

// ===========================================================================
// Order-specific SF GQL type projections
// ===========================================================================

export interface OrderStatus {
  value: string | null;
  label: string;
}

/** Covers both OrderBillingAddress and OrderShippingAddress (same interface fields). */
export interface OrderAddress {
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  stateOrProvince: string | null;
  postalCode: string;
  country: string;
  countryCode: string;
  phone: string | null;
  email: string | null;
}

export interface OrderLineItemProductOption {
  name: string;
  value: string;
}

/** Projects OrderPhysicalLineItem; OrderDigitalLineItem has a similar shape. */
export interface OrderLineItem {
  entityId: number;
  brand: string | null;
  name: string;
  quantity: number;
  productOptions: OrderLineItemProductOption[];
  subTotalListPrice: Money;
}

export interface OrderShipmentTracking {
  number?: string;
  url?: string;
}

export interface OrderShipment {
  entityId: number;
  shippedAt: DateTimeExtended;
  shippingMethodName: string;
  shippingProviderName: string;
  tracking: OrderShipmentTracking | null;
}

/** Projects OrderShippingConsignment. */
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

/** Nested inside OrderDiscounts.couponDiscounts. */
export interface OrderCouponDiscount {
  couponCode: string;
  discountedAmount: Money;
}

/** What Order.discounts returns (OrderDiscounts in SF GQL). */
export interface OrderDiscounts {
  couponDiscounts: OrderCouponDiscount[];
  nonCouponDiscountTotal: Money;
  totalDiscount: Money | null;
}

export interface OrderTax {
  name: string;
  amount: Money;
}

// ===========================================================================
// B2B extension types (from additionalTypeDefs/byPage/orders.ts)
// ===========================================================================

/** Projection of Company — selects entityId and name. */
export interface OrderCompany {
  entityId: number;
  name: string;
}

/** Projection of Customer — selects identity fields. */
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
  details: Record<string, unknown> | null;
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

// ===========================================================================
// Order (base SF GQL fields + B2B extensions)
// ===========================================================================

export interface Order {
  entityId: number;
  orderedAt: DateTimeExtended;
  updatedAt: DateTimeExtended;
  status: OrderStatus;
  billingAddress: OrderAddress;

  // Financial
  subTotal: Money;
  discountedSubTotal: Money | null;
  shippingCostTotal: Money;
  handlingCostTotal: Money;
  wrappingCostTotal: Money;
  taxTotal: Money;
  totalIncTax: Money;
  isTaxIncluded: boolean;
  taxes: OrderTax[];
  discounts: OrderDiscounts;

  // Content
  customerMessage: string | null;
  totalProductQuantity: number;
  consignments: OrderConsignments | null;

  // B2B extensions (null for B2C orders)
  reference: string | null;
  company: OrderCompany | null;
  placedBy: OrderPlacedBy | null;
  history: OrderHistoryEvent[];
  quote: OrderQuote | null;
  invoice: OrderInvoice | null;
  extraFields: ExtraFieldValue[];
}

// ===========================================================================
// B2B connection types
// ===========================================================================

export interface CompanyOrdersEdge {
  node: Order;
  cursor: string;
}

export interface CompanyOrdersConnection {
  edges: CompanyOrdersEdge[];
  pageInfo: PageInfo;
  collectionInfo: CollectionInfo | null;
}

export interface CompanyCustomerEdge {
  node: OrderPlacedBy;
  cursor: string;
}

export interface CompanyCustomerConnection {
  edges: CompanyCustomerEdge[];
  pageInfo: PageInfo;
}

// ===========================================================================
// B2B filter & sort types
// ===========================================================================

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

/**
 * SF GQL OrdersFiltersInput (base) + B2B extension fields.
 * Base: status, dateRange. Extension: search, companyName, companyIds.
 */
export interface OrdersFiltersInput {
  status?: string;
  dateRange?: OrderDateRangeFilterInput;
  search?: string;
  companyName?: string;
  companyIds?: string[];
}

export interface CustomerWithOrdersFiltersInput {
  companyIds?: string[];
}

// ===========================================================================
// Response wrappers (client-side only)
// ===========================================================================

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
        edges: Array<{ node: Order; cursor: string }>;
        pageInfo: PageInfo;
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

// ===========================================================================
// Fragments
// ===========================================================================

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
      shippedAt {
        utc
      }
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
    couponDiscounts {
      couponCode
      discountedAmount {
        ${moneyFields}
      }
    }
    nonCouponDiscountTotal {
      ${moneyFields}
    }
    totalDiscount {
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
    details
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
const orderListNodeFields = `entityId
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

// ===========================================================================
// Queries
// ===========================================================================

/** Company-scoped order list (B2B). Entry: customer.company.orders. */
const GET_COMPANY_ORDERS = `query GetCompanyOrders(
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

/**
 * My Orders (customer-scoped, B2B + B2C). Entry: customer.orders.
 * B2B fields auto-populate for B2B users, null for B2C.
 *
 * Note: OrdersConnection lacks collectionInfo; add once SF GQL team ships it.
 */
const GET_CUSTOMER_ORDERS = `query GetCustomerOrders(
  $filters: OrdersFiltersInput
  $sortBy: OrdersSortInput
  $first: Int
  $after: String
  $last: Int
  $before: String
) {
  customer {
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
    }
  }
}`;

/** Single order detail. Entry: site.order. */
const GET_ORDER_DETAIL = `query GetOrderDetail($entityId: Int!) {
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

/** Company customers who have placed orders. For "Placed By" filter dropdown. */
const GET_CUSTOMERS_WITH_ORDERS = `query GetCustomersWithOrders(
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

// ===========================================================================
// Service functions
// ===========================================================================

function graphqlRequest<T>(data: { query: string; variables?: object }): Promise<T> {
  return platform === 'bigcommerce'
    ? B3Request.graphqlBC<T>(data)
    : B3Request.graphqlBCProxy<T>(data);
}

/** Company Orders — all orders from all company members (B2B only). */
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

/** My Orders — customer-scoped, unified for B2B and B2C. */
export async function getCustomerOrders(variables: {
  filters?: OrdersFiltersInput;
  sortBy?: OrdersSortInput;
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}): Promise<GetCustomerOrdersResponse> {
  return graphqlRequest<GetCustomerOrdersResponse>({
    query: GET_CUSTOMER_ORDERS,
    variables,
  });
}

/** Single order detail by entityId. */
export async function getOrderDetail(variables: {
  entityId: number;
}): Promise<GetOrderDetailResponse> {
  return graphqlRequest<GetOrderDetailResponse>({
    query: GET_ORDER_DETAIL,
    variables,
  });
}

/** Customers who have placed orders within a company. */
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
