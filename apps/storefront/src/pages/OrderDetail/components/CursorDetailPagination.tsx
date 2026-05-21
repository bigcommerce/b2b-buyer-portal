import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { Box } from '@mui/material';
import IconButton from '@mui/material/IconButton';

import { useB3Lang } from '@/lib/lang';
import {
  CompanyOrdersFiltersInput,
  getCompanyOrders,
  getCustomerOrders,
  OrdersFiltersInput,
  OrdersSortInput,
} from '@/shared/service/bc/graphql/orders';

interface OrderPageItem {
  orderId: string;
  cursor: string;
}

export interface CursorLocationState {
  isCompanyOrder: boolean;
  /** Index of the current order within `orders`. */
  currentIndex: number;
  /** The full page of orders from the list view. */
  orders: OrderPageItem[];
  /** Page-level boundary flags from the list view's most recent pageInfo. */
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  /** Filter/sort state forwarded from the list view so we query the same result set. */
  filters: OrdersFiltersInput | CompanyOrdersFiltersInput;
  sortBy: OrdersSortInput;
  /** List view page size from `useUnifiedOrdersPagination` */
  pageSize: number;
}

/**
 * Fetches a full adjacent page in the given direction relative to `cursor`.
 * `mode: 'before'` → the previous page; `mode: 'after'` → the next page.
 * Returns the new orders array and updated pageInfo.
 */
async function fetchAdjacentPage(
  mode: 'before' | 'after',
  cursor: string,
  pageSize: number,
  isCompanyOrder: boolean,
  filters: OrdersFiltersInput | CompanyOrdersFiltersInput,
  sortBy: OrdersSortInput,
): Promise<{ orders: OrderPageItem[]; pageInfo: CursorLocationState['pageInfo'] } | null> {
  const paginationArgs =
    mode === 'before' ? { last: pageSize, before: cursor } : { first: pageSize, after: cursor };

  if (isCompanyOrder) {
    const result = await getCompanyOrders({
      ...paginationArgs,
      filters: filters as CompanyOrdersFiltersInput,
      sortBy,
    });
    const connection = result.data?.customer?.activeCompany?.orders;
    if (!connection) return null;
    return {
      orders: connection.edges.map((e) => ({
        orderId: String(e.node.entityId),
        cursor: e.cursor,
      })),
      pageInfo: {
        hasNextPage: connection.pageInfo.hasNextPage,
        hasPreviousPage: connection.pageInfo.hasPreviousPage,
      },
    };
  }

  const result = await getCustomerOrders({
    ...paginationArgs,
    filters: filters as OrdersFiltersInput,
    sortBy,
  });
  const connection = result.data?.customer?.orders;
  if (!connection) return null;
  return {
    orders: connection.edges.map((e) => ({
      orderId: String(e.node.entityId),
      cursor: e.cursor,
    })),
    pageInfo: {
      hasNextPage: connection.pageInfo.hasNextPage,
      hasPreviousPage: connection.pageInfo.hasPreviousPage,
    },
  };
}
interface CursorDetailPaginationProps {
  onChange: (id: number | string) => void;
  color: string;
}

/**
 * Prev/Next order navigation for the unified SF GQL path.
 *
 * Caches the full list page passed from the list view. Within-page navigation
 * is instant (zero API calls). Page-boundary navigation fetches one new page
 * and lands on the last (prev) or first (next) order of that page.
 *
 * Renders nothing when `orders` is absent (e.g. direct URL access with no
 * list context), satisfying the acceptance criterion for graceful degradation.
 */
export function CursorDetailPagination({ onChange, color }: CursorDetailPaginationProps) {
  const b3Lang = useB3Lang();
  const location = useLocation();
  const navigate = useNavigate();
  const init = location.state as CursorLocationState | null;

  const [orders, setOrders] = useState<OrderPageItem[]>(init?.orders ?? []);
  const [currentIndex, setCurrentIndex] = useState(init?.currentIndex ?? 0);
  const [pageInfo, setPageInfo] = useState(
    init?.pageInfo ?? { hasNextPage: false, hasPreviousPage: false },
  );
  const [loading, setLoading] = useState(false);

  const hasPrev = currentIndex > 0 || pageInfo.hasPreviousPage;
  const hasNext = currentIndex < orders.length - 1 || pageInfo.hasNextPage;

  /** Writes the current navigation state into the history entry. */
  const syncHistory = useCallback(
    (
      newOrders: OrderPageItem[],
      newIndex: number,
      newPageInfo: CursorLocationState['pageInfo'],
    ) => {
      if (!init) return;
      navigate(`/orderDetail/${newOrders[newIndex].orderId}`, {
        replace: true,
        state: {
          isCompanyOrder: init.isCompanyOrder,
          currentIndex: newIndex,
          orders: newOrders,
          pageInfo: newPageInfo,
          filters: init.filters,
          sortBy: init.sortBy,
          pageSize: init.pageSize,
        } satisfies CursorLocationState,
      });
    },
    [init, navigate],
  );

  /** No adjacent page found, then stop offering that direction and persist in history. */
  const exhaustBoundary = useCallback(
    (direction: 'prev' | 'next') => {
      const newPageInfo =
        direction === 'prev'
          ? { ...pageInfo, hasPreviousPage: false }
          : { ...pageInfo, hasNextPage: false };
      setPageInfo(newPageInfo);
      syncHistory(orders, currentIndex, newPageInfo);
    },
    [pageInfo, orders, currentIndex, syncHistory],
  );

  const handlePrev = useCallback(async () => {
    if (!hasPrev || loading || !init) return;
    setLoading(true);
    try {
      if (currentIndex > 0) {
        // In-page: instant, zero API calls.
        const newIndex = currentIndex - 1;
        setCurrentIndex(newIndex);
        onChange(orders[newIndex].orderId);
        syncHistory(orders, newIndex, pageInfo);
      } else {
        // Page boundary: fetch the previous page and land on its last item.
        const page = await fetchAdjacentPage(
          'before',
          orders[0].cursor,
          init.pageSize,
          init.isCompanyOrder,
          init.filters,
          init.sortBy,
        );
        if (page && page.orders.length > 0) {
          const newIndex = page.orders.length - 1;
          setOrders(page.orders);
          setCurrentIndex(newIndex);
          setPageInfo(page.pageInfo);
          onChange(page.orders[newIndex].orderId);
          syncHistory(page.orders, newIndex, page.pageInfo);
        } else {
          exhaustBoundary('prev');
        }
      }
    } catch {
      if (currentIndex === 0) {
        exhaustBoundary('prev');
      }
    } finally {
      setLoading(false);
    }
  }, [
    hasPrev,
    loading,
    init,
    currentIndex,
    orders,
    pageInfo,
    onChange,
    syncHistory,
    exhaustBoundary,
  ]);

  const handleNext = useCallback(async () => {
    if (!hasNext || loading || !init) return;
    setLoading(true);
    try {
      if (currentIndex < orders.length - 1) {
        // In-page: instant, zero API calls.
        const newIndex = currentIndex + 1;
        setCurrentIndex(newIndex);
        onChange(orders[newIndex].orderId);
        syncHistory(orders, newIndex, pageInfo);
      } else {
        // Page boundary: fetch the next page and land on its first item.
        const page = await fetchAdjacentPage(
          'after',
          orders[orders.length - 1].cursor,
          init.pageSize,
          init.isCompanyOrder,
          init.filters,
          init.sortBy,
        );
        if (page && page.orders.length > 0) {
          setOrders(page.orders);
          setCurrentIndex(0);
          setPageInfo(page.pageInfo);
          onChange(page.orders[0].orderId);
          syncHistory(page.orders, 0, page.pageInfo);
        } else {
          exhaustBoundary('next');
        }
      }
    } catch {
      if (currentIndex === orders.length - 1) {
        exhaustBoundary('next');
      }
    } finally {
      setLoading(false);
    }
  }, [
    hasNext,
    loading,
    init,
    currentIndex,
    orders,
    pageInfo,
    onChange,
    syncHistory,
    exhaustBoundary,
  ]);

  // Graceful degradation: hide when there is no cached page context
  // (e.g. direct URL access, missing cursors, or an empty list page).
  if (!init?.orders?.length) return null;

  return (
    <Box role="navigation" sx={{ display: 'flex', color }}>
      <IconButton
        aria-label={b3Lang('orderDetail.pagination.previousOrder')}
        onClick={handlePrev}
        disabled={!hasPrev || loading}
      >
        <NavigateBeforeIcon sx={{ color }} />
      </IconButton>
      <IconButton
        aria-label={b3Lang('orderDetail.pagination.nextOrder')}
        onClick={handleNext}
        disabled={!hasNext || loading}
      >
        <NavigateNextIcon sx={{ color }} />
      </IconButton>
    </Box>
  );
}
