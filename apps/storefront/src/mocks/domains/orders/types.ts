export interface Money {
  currencyCode: string;
  value: number;
}

export interface DateTimeExtended {
  utc: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

interface OrderStatus {
  value: string | null;
  label: string;
}

interface OrderAddress {
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

interface OrderCompany {
  entityId: number;
  name: string;
}

interface OrderPlacedBy {
  entityId: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Order {
  entityId: number;
  orderedAt: DateTimeExtended;
  updatedAt: DateTimeExtended;
  status: OrderStatus;
  billingAddress: OrderAddress;
  subTotal: Money;
  discountedSubTotal: Money | null;
  shippingCostTotal: Money;
  handlingCostTotal: Money;
  wrappingCostTotal: Money;
  taxTotal: Money;
  totalIncTax: Money;
  isTaxIncluded: boolean;
  taxes: Array<{ name: string; amount: Money }>;
  discounts: {
    couponDiscounts: Array<{ couponCode: string; discountedAmount: Money }>;
    nonCouponDiscountTotal: Money;
    totalDiscount: Money | null;
  };
  customerMessage: string | null;
  totalProductQuantity: number;
  consignments: unknown;
  reference: string | null;
  company: OrderCompany | null;
  placedBy: OrderPlacedBy | null;
  history: unknown[];
  quote: { id: string } | null;
  invoice: { id: string } | null;
  extraFields: Array<{ name: string; value: string }>;
}

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
