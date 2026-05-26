import { useCallback } from 'react';
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
import { snackbar } from '@/utils/b3Tip';

import {
  type CursorItem,
  type CursorPageInfo,
  useCursorDetailPagination,
} from '../useCursorDetailPagination';

/** Shape stored in router history state (no `id` field required from callers). */
interface OrderPageItem {
  orderId: string;
  cursor: string;
}

/** Internal shape used with the generic hook (adds the required `id` field). */
interface OrderCursorItem extends CursorItem {
  orderId: string;
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
 */
async function fetchAdjacentPage(
  mode: 'before' | 'after',
  cursor: string,
  pageSize: number,
  isCompanyOrder: boolean,
  filters: OrdersFiltersInput | CompanyOrdersFiltersInput,
  sortBy: OrdersSortInput,
): Promise<{ items: OrderCursorItem[]; pageInfo: CursorLocationState['pageInfo'] }> {
  const paginationArgs =
    mode === 'before' ? { last: pageSize, before: cursor } : { first: pageSize, after: cursor };

  const toItems = (edges: { cursor: string; node: { entityId: number } }[]): OrderCursorItem[] =>
    edges.map((e) => ({
      id: String(e.node.entityId),
      orderId: String(e.node.entityId),
      cursor: e.cursor,
    }));

  const toPage = (orders: {
    edges: { cursor: string; node: { entityId: number } }[];
    pageInfo: CursorLocationState['pageInfo'];
  }) => ({
    items: toItems(orders.edges),
    pageInfo: {
      hasNextPage: orders.pageInfo.hasNextPage,
      hasPreviousPage: orders.pageInfo.hasPreviousPage,
    },
  });

  if (isCompanyOrder) {
    const result = await getCompanyOrders({
      ...paginationArgs,
      filters: filters as CompanyOrdersFiltersInput,
      sortBy,
    });
    const orders = result.data?.customer?.activeCompany?.orders;
    if (!orders) throw new Error('Unexpected API response: orders missing');
    return toPage(orders);
  }

  const result = await getCustomerOrders({
    ...paginationArgs,
    filters: filters as OrdersFiltersInput,
    sortBy,
  });
  const orders = result.data?.customer?.orders;
  if (!orders) throw new Error('Unexpected API response: orders missing');
  return toPage(orders);
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

  // Convert OrderPageItem[] → OrderCursorItem[] for the generic hook.
  const initialItems: OrderCursorItem[] = (init?.orders ?? []).map((o) => ({
    ...o,
    id: o.orderId,
  }));

  const fetchPage = useCallback(
    async (mode: 'before' | 'after', cursor: string) => {
      if (!init) return null;
      try {
        return await fetchAdjacentPage(
          mode,
          cursor,
          init.pageSize,
          init.isCompanyOrder,
          init.filters,
          init.sortBy,
        );
      } catch (error) {
        snackbar.error(b3Lang('orderDetail.pagination.fetchError'));
        throw error; // re-throw so the hook leaves pageInfo unchanged and the user can retry
      }
    },
    [init, b3Lang],
  );

  const buildHistoryState = useCallback(
    (index: number, items: CursorItem[], pageInfo: CursorPageInfo): CursorLocationState | null => {
      if (!init) return null;
      const orderItems = items as OrderCursorItem[];
      return {
        isCompanyOrder: init.isCompanyOrder,
        currentIndex: index,
        orders: orderItems.map(({ orderId, cursor }) => ({ orderId, cursor })),
        pageInfo,
        filters: init.filters,
        sortBy: init.sortBy,
        pageSize: init.pageSize,
      };
    },
    [init],
  );

  const onNavigate = useCallback(
    (item: CursorItem, index: number, items: CursorItem[], pageInfo: CursorPageInfo) => {
      const nextState = buildHistoryState(index, items, pageInfo);
      if (!nextState) return;
      onChange(item.id);
      navigate(`/orderDetail/${item.id}`, {
        replace: true,
        state: nextState,
      });
    },
    [navigate, onChange, buildHistoryState],
  );

  const onSyncHistory = useCallback(
    (index: number, items: CursorItem[], pageInfo: CursorPageInfo) => {
      const nextState = buildHistoryState(index, items, pageInfo);
      if (!nextState) return;
      // Boundary exhausted — current item unchanged, only pageInfo needs persisting.
      navigate(location.pathname, {
        replace: true,
        state: nextState,
      });
    },
    [navigate, location.pathname, buildHistoryState],
  );

  const { hasPrev, hasNext, loading, handlePrev, handleNext } = useCursorDetailPagination({
    initialItems,
    initialIndex: init?.currentIndex ?? 0,
    initialPageInfo: init?.pageInfo ?? { hasNextPage: false, hasPreviousPage: false },
    fetchPage,
    onNavigate,
    onSyncHistory,
  });

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
