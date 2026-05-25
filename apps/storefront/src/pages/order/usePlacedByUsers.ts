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
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['placedByUsers', companyIds],
    enabled,
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      getCustomersWithOrders({
        filters: companyIds ? { companyIds } : undefined,
        first: 100,
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
