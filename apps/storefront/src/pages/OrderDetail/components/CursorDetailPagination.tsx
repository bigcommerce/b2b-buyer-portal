import { useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
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

// ===========================================================================
// Types
// ===========================================================================

/**
 * Navigation state written by `Order.tsx#goToDetail` and consumed here.
 * The presence of `currentCursor` distinguishes this shape from the legacy
 * offset-based state checked in `DetailPagination`.
 *
 * Export so callers (Order.tsx) can type their navigate() state arg.
 */
export interface CursorLocationState {
  isCompanyOrder: boolean;
  /** orderId of the order currently shown. */
  currentOrderId: string;
  /** SF GQL cursor for the current order. */
  currentCursor: string;
  /** orderId of the in-page predecessor (null when current is first on this page). */
  prevOrderId: string | null;
  /** SF GQL cursor for the predecessor. */
  prevCursor: string | null;
  /** orderId of the in-page successor (null when current is last on this page). */
  nextOrderId: string | null;
  /** SF GQL cursor for the successor. */
  nextCursor: string | null;
  /** Page-level boundary flags from the list view's most recent pageInfo. */
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  /** Filter/sort state forwarded from the list view so we query the same result set. */
  filters: OrdersFiltersInput | CompanyOrdersFiltersInput;
  sortBy: OrdersSortInput;
}

type OrderEdgeInfo = { orderId: string; cursor: string } | null;

// ===========================================================================
// Module-level helper
// ===========================================================================

/**
 * Fetches a single adjacent order in the given direction relative to `cursor`.
 * `mode: 'before'` → the previous order; `mode: 'after'` → the next order.
 * Returns `{ orderId, cursor }` or `null` when no adjacent order exists.
 */
async function fetchSingleOrder(
  mode: 'before' | 'after',
  cursor: string,
  isCompanyOrder: boolean,
  filters: OrdersFiltersInput | CompanyOrdersFiltersInput,
  sortBy: OrdersSortInput,
): Promise<OrderEdgeInfo> {
  const paginationArgs =
    mode === 'before' ? { last: 1, before: cursor } : { first: 1, after: cursor };

  if (isCompanyOrder) {
    const result = await getCompanyOrders({
      ...paginationArgs,
      filters: filters as CompanyOrdersFiltersInput,
      sortBy,
    });
    const edge = result.data?.customer?.activeCompany?.orders?.edges?.[0];
    return edge ? { orderId: String(edge.node.entityId), cursor: edge.cursor } : null;
  }

  const result = await getCustomerOrders({
    ...paginationArgs,
    filters: filters as OrdersFiltersInput,
    sortBy,
  });
  const edge = result.data?.customer?.orders?.edges?.[0];
  return edge ? { orderId: String(edge.node.entityId), cursor: edge.cursor } : null;
}

// ===========================================================================
// Component
// ===========================================================================

interface CursorDetailPaginationProps {
  onChange: (id: number | string) => void;
  color: string;
}

/**
 * Prev/Next order navigation for the unified SF GQL path (B2B-4629).
 *
 * Button enabled states are derived instantly from the navigation state passed
 * by the list view — no network request on mount.
 *
 * Every navigation triggers exactly one API call: the order we just left is
 * always the known neighbour in the opposite direction (set directly), so only
 * the far unknown side needs to be fetched. Page-boundary clicks incur one
 * extra call to resolve the target before navigating, for two calls total.
 *
 * Renders nothing when `currentCursor` is absent (e.g. direct URL access with
 * no list context), satisfying the acceptance criterion for graceful degradation.
 */
export function CursorDetailPagination({ onChange, color }: CursorDetailPaginationProps) {
  const b3Lang = useB3Lang();
  const location = useLocation();
  const init = location.state as CursorLocationState | null;

  // All hooks must run unconditionally before the null guard at the bottom of this function.
  const [currentOrderId, setCurrentOrderId] = useState(init?.currentOrderId ?? '');
  const [currentCursor, setCurrentCursor] = useState(init?.currentCursor ?? '');
  const [prevInfo, setPrevInfo] = useState<OrderEdgeInfo>(
    init?.prevOrderId && init?.prevCursor
      ? { orderId: init.prevOrderId, cursor: init.prevCursor }
      : null,
  );
  const [nextInfo, setNextInfo] = useState<OrderEdgeInfo>(
    init?.nextOrderId && init?.nextCursor
      ? { orderId: init.nextOrderId, cursor: init.nextCursor }
      : null,
  );
  // Enabled states set immediately from init — no fetch needed on mount.
  const [hasPrev, setHasPrev] = useState(
    init?.prevOrderId != null || (init?.pageInfo?.hasPreviousPage ?? false),
  );
  const [hasNext, setHasNext] = useState(
    init?.nextOrderId != null || (init?.pageInfo?.hasNextPage ?? false),
  );
  const [loading, setLoading] = useState(false);

  /**
   * Navigates to `edge` in the given direction with exactly one API call.
   *
   * The order we're leaving is always the known neighbour in the opposite
   * direction — we set it directly without fetching. Only the far side
   * (the order beyond where we're going) is truly unknown and requires a fetch.
   *
   * Callers are responsible for managing the `loading` state.
   */
  const navigateTo = useCallback(
    async (edge: NonNullable<OrderEdgeInfo>, direction: 'prev' | 'next') => {
      // init is guaranteed non-null here: buttons only render after the guard below.
      if (!init) return;

      // Capture departing position before updating state.
      const departingNeighbour: OrderEdgeInfo = { orderId: currentOrderId, cursor: currentCursor };

      setCurrentOrderId(edge.orderId);
      setCurrentCursor(edge.cursor);
      onChange(edge.orderId);

      if (direction === 'prev') {
        // Moved backward: the order we left is the new "next" — no fetch needed.
        setNextInfo(departingNeighbour);
        setHasNext(true);
        // The new "prev" (one step further back) is unknown — fetch it.
        setPrevInfo(null);
        const fetched = await fetchSingleOrder(
          'before',
          edge.cursor,
          init.isCompanyOrder,
          init.filters,
          init.sortBy,
        );
        setPrevInfo(fetched);
        setHasPrev(fetched !== null);
      } else {
        // Moved forward: the order we left is the new "prev" — no fetch needed.
        setPrevInfo(departingNeighbour);
        setHasPrev(true);
        // The new "next" (one step further forward) is unknown — fetch it.
        setNextInfo(null);
        const fetched = await fetchSingleOrder(
          'after',
          edge.cursor,
          init.isCompanyOrder,
          init.filters,
          init.sortBy,
        );
        setNextInfo(fetched);
        setHasNext(fetched !== null);
      }
    },
    [currentOrderId, currentCursor, onChange, init],
  );

  const handlePrev = useCallback(async () => {
    if (!hasPrev || loading) return;
    setLoading(true);
    try {
      // Fast path: neighbour already known from the list page or a prior navigation.
      const target =
        prevInfo ??
        (init &&
          (await fetchSingleOrder(
            'before',
            currentCursor,
            init.isCompanyOrder,
            init.filters,
            init.sortBy,
          )));
      if (target) {
        await navigateTo(target, 'prev');
      } else {
        setHasPrev(false);
      }
    } finally {
      setLoading(false);
    }
  }, [hasPrev, loading, prevInfo, currentCursor, init, navigateTo]);

  const handleNext = useCallback(async () => {
    if (!hasNext || loading) return;
    setLoading(true);
    try {
      // Fast path: neighbour already known from the list page or a prior navigation.
      const target =
        nextInfo ??
        (init &&
          (await fetchSingleOrder(
            'after',
            currentCursor,
            init.isCompanyOrder,
            init.filters,
            init.sortBy,
          )));
      if (target) {
        await navigateTo(target, 'next');
      } else {
        setHasNext(false);
      }
    } finally {
      setLoading(false);
    }
  }, [hasNext, loading, nextInfo, currentCursor, init, navigateTo]);

  // Graceful degradation: hide when there is no cursor navigation context
  // (e.g. the user landed directly on the detail URL without coming from the list).
  if (!init?.currentCursor) return null;

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
