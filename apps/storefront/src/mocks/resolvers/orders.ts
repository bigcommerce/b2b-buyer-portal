import { OrdersSortInput } from '@/shared/service/bc/graphql/orders';
import type { Order, PageInfo } from '@/shared/service/bc/graphql/orders';

import { orderStore } from '../store';

interface ExecuteGetCustomerOrdersArgs {
  variables?: unknown;
}

interface NormalizedGetCustomerOrdersVariables {
  filters: {
    search?: string;
    status?: string;
  };
  sortBy?: OrdersSortInput | `${OrdersSortInput}`;
  first?: number;
}

interface CustomerOrdersConnection {
  edges: Array<{ node: Order; cursor: string }>;
  pageInfo: PageInfo;
}

interface SuccessfulGetCustomerOrdersResponse {
  data: {
    customer: {
      orders: CustomerOrdersConnection;
    };
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function getStringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function normalizeVariables(variables: unknown): NormalizedGetCustomerOrdersVariables {
  const filters = isRecord(variables) && isRecord(variables.filters) ? variables.filters : {};

  return {
    filters: {
      search: getStringValue(filters.search),
      status: getStringValue(filters.status),
    },
    sortBy: isRecord(variables) ? getStringValue(variables.sortBy) : undefined,
    first: isRecord(variables) && typeof variables.first === 'number' ? variables.first : undefined,
  };
}

function matchesSearch(order: Order, search = ''): boolean {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [String(order.entityId), order.reference ?? ''].some((value) =>
    value.toLowerCase().includes(normalizedSearch),
  );
}

function matchesStatus(order: Order, status?: string): boolean {
  if (!status) {
    return true;
  }

  return order.status.value === status || order.status.label === status;
}

function sortOrders(orders: Order[], sortBy?: NormalizedGetCustomerOrdersVariables['sortBy']) {
  const sorted = [...orders];

  if (sortBy === OrdersSortInput.CREATED_AT_OLDEST) {
    return sorted.sort((left, right) => left.orderedAt.utc.localeCompare(right.orderedAt.utc));
  }

  return sorted.sort((left, right) => right.orderedAt.utc.localeCompare(left.orderedAt.utc));
}

export async function executeGetCustomerOrders({
  variables,
}: ExecuteGetCustomerOrdersArgs = {}): Promise<SuccessfulGetCustomerOrdersResponse> {
  const normalizedVariables = normalizeVariables(variables);
  const filteredOrders = orderStore.getOrders().filter(
    (order) =>
      matchesStatus(order, normalizedVariables.filters.status) &&
      matchesSearch(order, normalizedVariables.filters.search),
  );
  const sortedOrders = sortOrders(filteredOrders, normalizedVariables.sortBy);
  const first = normalizedVariables.first ?? sortedOrders.length;
  const pagedOrders = sortedOrders.slice(0, first);

  return {
    data: {
      customer: {
        orders: {
          edges: pagedOrders.map((order) => ({
            node: order,
            cursor: String(order.entityId),
          })),
          pageInfo: {
            hasNextPage: sortedOrders.length > pagedOrders.length,
            hasPreviousPage: false,
            startCursor: pagedOrders[0] ? String(pagedOrders[0].entityId) : null,
            endCursor: pagedOrders[pagedOrders.length - 1]
              ? String(pagedOrders[pagedOrders.length - 1].entityId)
              : null,
          },
        },
      },
    },
  };
}
