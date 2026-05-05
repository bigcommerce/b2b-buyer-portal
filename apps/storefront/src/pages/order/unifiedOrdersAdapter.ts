import type {
  GetCustomerOrdersResponse,
  Money,
  OrdersFiltersInput,
} from '@/shared/service/bc/graphql/orders';
import { OrdersSortInput } from '@/shared/service/bc/graphql/orders';

import { FilterSearchProps } from './config';

interface LegacyOrderListResponse {
  totalCount: number;
  edges: Array<{
    orderId: string;
    poNumber: string;
    money: string;
    totalIncTax: string;
    status: string;
    createdAt: string;
    firstName: string;
    lastName: string;
    companyName: string;
  }>;
}

interface UnifiedPaginationContext {
  offset?: number;
  first?: number;
}

interface UnifiedOrderVariables {
  filters: OrdersFiltersInput;
  sortBy: OrdersSortInput;
  first?: number;
  after?: string;
}

function unixSeconds(utc: string): string {
  return String(Math.floor(new Date(utc).getTime() / 1000));
}

function moneyFormatFor({ currencyCode }: Money): string {
  const currencyTokenByCode: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
  };

  return JSON.stringify({
    currency_token: currencyTokenByCode[currencyCode] ?? currencyCode,
    currency_location: 'left',
    decimal_places: 2,
  });
}

function getLowerBoundTotalCount(
  response: GetCustomerOrdersResponse,
  edgeCount: number,
  { offset = 0, first = edgeCount }: UnifiedPaginationContext = {},
): number {
  const hasNextPage = response.data?.customer?.orders?.pageInfo.hasNextPage === true;

  return hasNextPage ? offset + first + 1 : offset + edgeCount;
}

export function mapUnifiedOrdersResponseToLegacyList(
  response: GetCustomerOrdersResponse,
  pagination?: UnifiedPaginationContext,
): LegacyOrderListResponse {
  const edges = response.data?.customer?.orders?.edges ?? [];

  return {
    totalCount: getLowerBoundTotalCount(response, edges.length, pagination),
    edges: edges.map(({ node }) => ({
      orderId: String(node.entityId),
      poNumber: node.reference ?? '',
      money: moneyFormatFor(node.totalIncTax),
      totalIncTax: String(node.totalIncTax.value),
      status: node.status.label,
      createdAt: unixSeconds(node.orderedAt.utc),
      firstName: node.placedBy?.firstName ?? '',
      lastName: node.placedBy?.lastName ?? '',
      companyName: node.company?.name ?? '',
    })),
  };
}

export function mapLegacyOrderByToUnifiedSort(orderBy?: string): OrdersSortInput {
  const sortMap: Record<string, OrdersSortInput> = {
    '-createdAt': OrdersSortInput.CREATED_AT_NEWEST,
    createdAt: OrdersSortInput.CREATED_AT_OLDEST,
    '-bcOrderId': OrdersSortInput.ID_Z_TO_A,
    bcOrderId: OrdersSortInput.ID_A_TO_Z,
    '-poNumber': OrdersSortInput.REFERENCE_Z_TO_A,
    poNumber: OrdersSortInput.REFERENCE_A_TO_Z,
  };

  return orderBy
    ? (sortMap[orderBy] ?? OrdersSortInput.CREATED_AT_NEWEST)
    : OrdersSortInput.CREATED_AT_NEWEST;
}

export function mapFilterDataToUnifiedVariables(
  params: Partial<FilterSearchProps>,
  after?: string,
): UnifiedOrderVariables {
  const status = params.orderStatus ?? params.statusCode;
  const filters: OrdersFiltersInput = {};

  if (params.q) {
    filters.search = String(params.q);
  }

  if (status) {
    filters.status = String(status);
  }

  if (params.beginDateAt) {
    filters.dateRange = {
      from: String(params.beginDateAt),
      ...(params.endDateAt ? { to: String(params.endDateAt) } : {}),
    };
  }

  return {
    filters,
    sortBy: mapLegacyOrderByToUnifiedSort(params.orderBy),
    first: typeof params.first === 'number' ? params.first : undefined,
    ...(after ? { after } : {}),
  };
}
