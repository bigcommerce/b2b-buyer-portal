import { OrdersSortInput } from '@/shared/service/bc/graphql/orders';
import type { Order, PageInfo } from '@/shared/service/bc/graphql/orders';

import { orderStore } from '../store';

interface ExecuteGetCustomerOrdersArgs {
  variables?: {
    filters?: {
      search?: string;
      status?: string;
    };
    sortBy?: OrdersSortInput | `${OrdersSortInput}`;
    first?: number;
  };
}

type ExecuteGetCustomerOrdersVariables = NonNullable<ExecuteGetCustomerOrdersArgs['variables']>;

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

function sortOrders(orders: Order[], sortBy?: ExecuteGetCustomerOrdersVariables['sortBy']) {
  const sorted = [...orders];

  if (sortBy === OrdersSortInput.CREATED_AT_OLDEST) {
    return sorted.sort((left, right) => left.orderedAt.utc.localeCompare(right.orderedAt.utc));
  }

  return sorted.sort((left, right) => right.orderedAt.utc.localeCompare(left.orderedAt.utc));
}

export async function executeGetCustomerOrders({
  variables,
}: ExecuteGetCustomerOrdersArgs = {}): Promise<SuccessfulGetCustomerOrdersResponse> {
  const filteredOrders = orderStore.getOrders().filter(
    (order) =>
      matchesStatus(order, variables?.filters?.status) &&
      matchesSearch(order, variables?.filters?.search),
  );
  const sortedOrders = sortOrders(filteredOrders, variables?.sortBy);
  const first = variables?.first ?? sortedOrders.length;
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
