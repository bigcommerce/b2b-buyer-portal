import { createElement, PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type {
  GetCustomersWithOrdersResponse,
  OrderPlacedBy,
} from '@/shared/service/bc/graphql/orders';

import { usePlacedByUsers } from './usePlacedByUsers';

vi.mock('@/shared/service/bc/graphql/orders', () => ({
  getCustomersWithOrders: vi.fn(),
}));

const { getCustomersWithOrders } = await import('@/shared/service/bc/graphql/orders');
const mockGetCustomersWithOrders = vi.mocked(getCustomersWithOrders);

function makeUser(entityId: number): OrderPlacedBy {
  return {
    entityId,
    firstName: `First${entityId}`,
    lastName: `Last${entityId}`,
    email: `user${entityId}@test.com`,
  };
}

function makePage(
  users: OrderPlacedBy[],
  hasNextPage: boolean,
  endCursor: string | null = null,
): GetCustomersWithOrdersResponse {
  return {
    data: {
      customer: {
        activeCompany: {
          customersWithOrders: {
            edges: users.map((u) => ({ node: u, cursor: String(u.entityId) })),
            pageInfo: {
              hasNextPage,
              hasPreviousPage: false,
              startCursor: users.length ? String(users[0].entityId) : null,
              endCursor,
            },
          },
        },
      },
    },
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: PropsWithChildren) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('usePlacedByUsers', () => {
  it('returns empty array when disabled', () => {
    const { result } = renderHook(
      () => usePlacedByUsers({ enabled: false, companyIds: undefined }),
      { wrapper: createWrapper() },
    );
    expect(result.current).toEqual([]);
    expect(mockGetCustomersWithOrders).not.toHaveBeenCalled();
  });

  it('fetches a single page of users', async () => {
    const users = [makeUser(1), makeUser(2)];
    mockGetCustomersWithOrders.mockResolvedValueOnce(makePage(users, false));

    const { result } = renderHook(
      () => usePlacedByUsers({ enabled: true, companyIds: undefined }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current).toHaveLength(2));
    expect(result.current).toEqual(users);
    expect(mockGetCustomersWithOrders).toHaveBeenCalledTimes(1);
    expect(mockGetCustomersWithOrders).toHaveBeenCalledWith({
      filters: undefined,
      first: 100,
      after: undefined,
    });
  });

  it('paginates through multiple pages', async () => {
    const page1Users = [makeUser(1), makeUser(2)];
    const page2Users = [makeUser(3)];
    mockGetCustomersWithOrders
      .mockResolvedValueOnce(makePage(page1Users, true, 'cursor-2'))
      .mockResolvedValueOnce(makePage(page2Users, false));

    const { result } = renderHook(
      () => usePlacedByUsers({ enabled: true, companyIds: undefined }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current).toHaveLength(3));
    expect(result.current).toEqual([...page1Users, ...page2Users]);
    expect(mockGetCustomersWithOrders).toHaveBeenCalledTimes(2);
    expect(mockGetCustomersWithOrders).toHaveBeenLastCalledWith({
      filters: undefined,
      first: 100,
      after: 'cursor-2',
    });
  });

  it('passes companyIds filter when provided', async () => {
    mockGetCustomersWithOrders.mockResolvedValueOnce(makePage([makeUser(1)], false));

    const { result } = renderHook(
      () => usePlacedByUsers({ enabled: true, companyIds: ['10', '20'] }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(mockGetCustomersWithOrders).toHaveBeenCalledWith({
      filters: { companyIds: ['10', '20'] },
      first: 100,
      after: undefined,
    });
  });

  it('refetches when companyIds change', async () => {
    const usersA = [makeUser(1)];
    const usersB = [makeUser(2), makeUser(3)];
    mockGetCustomersWithOrders
      .mockResolvedValueOnce(makePage(usersA, false))
      .mockResolvedValueOnce(makePage(usersB, false));

    const { result, rerender } = renderHook(
      ({ companyIds }: { companyIds: string[] | undefined }) =>
        usePlacedByUsers({ enabled: true, companyIds }),
      { wrapper: createWrapper(), initialProps: { companyIds: ['10'] } },
    );

    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(result.current).toEqual(usersA);

    rerender({ companyIds: ['20'] });

    await waitFor(() => expect(result.current).toHaveLength(2));
    expect(result.current).toEqual(usersB);
  });
});
