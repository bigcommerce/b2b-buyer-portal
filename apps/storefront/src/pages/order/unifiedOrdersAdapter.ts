import { Money, OrdersSortInput } from '@/shared/service/bc/graphql/orders';

import { FilterSearchProps } from './config';

interface UnifiedOrdersListResponse {
  data?: {
    customer?: {
      orders?: {
        edges: Array<{
          cursor?: string;
          node: {
            entityId: number;
            orderedAt: { utc: string };
            totalIncTax: Money;
            status: { value?: string | null; label: string };
            reference: string | null;
            company: { entityId?: number; name: string } | null;
            placedBy: {
              entityId?: number;
              firstName: string;
              lastName: string;
              email?: string;
            } | null;
          };
        }>;
        pageInfo?: {
          hasNextPage: boolean;
          hasPreviousPage: boolean;
          startCursor?: string | null;
          endCursor?: string | null;
        };
      };
    };
  };
}

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

export function mapUnifiedOrdersResponseToLegacyList(
  response: UnifiedOrdersListResponse,
): LegacyOrderListResponse {
  const edges = response.data?.customer?.orders?.edges ?? [];

  return {
    totalCount: edges.length,
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

export function mapFilterDataToUnifiedVariables(params: Partial<FilterSearchProps>) {
  const status = params.orderStatus ?? params.statusCode;

  return {
    filters: {
      search: params.q ? String(params.q) : undefined,
      status: status ? String(status) : undefined,
    },
    sortBy: mapLegacyOrderByToUnifiedSort(params.orderBy),
    first: typeof params.first === 'number' ? params.first : undefined,
  };
}
