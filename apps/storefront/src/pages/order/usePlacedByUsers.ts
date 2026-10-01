import { useEffect, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

import {
  getCustomersWithOrders,
  type GetCustomersWithOrdersResponse,
  type OrderPlacedBy,
} from '@/shared/service/bc/graphql/orders';

interface UsePlacedByUsersArgs {
  enabled: boolean;
  companyIds?: string[];
}

export function usePlacedByUsers({ enabled, companyIds }: UsePlacedByUsersArgs): OrderPlacedBy[] {
  // customersWithOrders API was removed by BE (2026-09-30, Keelan).
  // Placed By dropdown now uses legacy createdByUser in Order.tsx.
  // This hook is disabled until BE deploys activeCompany.users.
  const queryDisabled = false;

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['placedByUsers', companyIds],
    enabled: queryDisabled && enabled,
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      getCustomersWithOrders({
        filters: companyIds ? { companyIds } : undefined,
        first: 50,
        after: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: GetCustomersWithOrdersResponse) => {
      const pageInfo = lastPage.data?.customer?.activeCompany?.customersWithOrders?.pageInfo;
      return pageInfo?.hasNextPage ? (pageInfo.endCursor ?? undefined) : undefined;
    },
  });

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return useMemo(
    () =>
      data?.pages.flatMap(
        (page) =>
          page.data?.customer?.activeCompany?.customersWithOrders?.edges?.map((e) => e.node) ?? [],
      ) ?? [],
    [data],
  );
}
