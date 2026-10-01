import { createElement, PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { usePlacedByUsers } from './usePlacedByUsers';

vi.mock('@/shared/service/bc/graphql/orders', () => ({
  getCustomersWithOrders: vi.fn(),
}));

const { getCustomersWithOrders } = await import('@/shared/service/bc/graphql/orders');
const mockGetCustomersWithOrders = vi.mocked(getCustomersWithOrders);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: PropsWithChildren) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

// The customersWithOrders SF GQL API was removed (Keelan, 2026-09-30).
// The Placed By dropdown now uses the legacy createdByUser query directly in Order.tsx.
// This hook is disabled (queryEnabled = false) until activeCompany.users is on the schema.
// These tests verify the hook returns empty and never calls the removed API.

describe('usePlacedByUsers', () => {
  it('returns empty array when disabled', () => {
    const { result } = renderHook(
      () => usePlacedByUsers({ enabled: false, companyIds: undefined }),
      { wrapper: createWrapper() },
    );
    expect(result.current).toEqual([]);
    expect(mockGetCustomersWithOrders).not.toHaveBeenCalled();
  });

  it('returns empty array even when enabled (query disabled until activeCompany.users is available)', () => {
    const { result } = renderHook(
      () => usePlacedByUsers({ enabled: true, companyIds: undefined }),
      { wrapper: createWrapper() },
    );
    expect(result.current).toEqual([]);
    expect(mockGetCustomersWithOrders).not.toHaveBeenCalled();
  });

  it('does not call customersWithOrders regardless of companyIds', () => {
    const { result } = renderHook(
      () => usePlacedByUsers({ enabled: true, companyIds: ['10', '20'] }),
      { wrapper: createWrapper() },
    );
    expect(result.current).toEqual([]);
    expect(mockGetCustomersWithOrders).not.toHaveBeenCalled();
  });
});
