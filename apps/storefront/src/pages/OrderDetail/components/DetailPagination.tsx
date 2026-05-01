import { useEffect, useId, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';

import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import { getB2BAllOrders, getBCAllOrders } from '@/shared/service/b2b';
import {
  getCustomerOrders,
  OrdersFiltersInput,
  OrdersSortInput,
} from '@/shared/service/bc/graphql/orders';
import { isB2BUserSelector, useAppSelector } from '@/store';

interface SearchParamsProps {
  [key: string]: number | string | undefined;
  orderBy: string;
  offset: number;
  first: number;
}

interface DetailPageProps {
  onChange: (id: number | string) => void;
  color: string;
}

interface LocationState {
  beginDateAt?: string | null;
  endDateAt?: string | null;
  currentIndex?: number;
  totalCount?: number;
  isCompanyOrder?: boolean;
  searchParams?: SearchParamsProps;
  // Unified SF GQL path — populated by Order.tsx when B2B-4613 is ON and not a company order.
  unifiedCustomerFilters?: OrdersFiltersInput;
  unifiedCustomerSortBy?: OrdersSortInput;
}

interface RightLeftSideProps {
  rightId: number | string;
  leftId: number | string;
}

const initListIndex = 100000000;

const defaultSearchParams = {
  orderBy: '-createdAt',
  offset: 0,
};

export function DetailPagination({ onChange, color }: DetailPageProps) {
  const b3Lang = useB3Lang();
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const isUnifiedOrders = useFeatureFlag('B2B-4613.buyer_portal_unified_sf_gql_orders');

  const [listIndex, setListIndex] = useState<number>(initListIndex);
  const [arrived, setArrived] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [rightLeftSide, setRightLeftSide] = useState<RightLeftSideProps>({
    rightId: '',
    leftId: '',
  });

  const location = useLocation();
  const [isMobile] = useMobile();

  let currentIndex = 0;
  let totalCount = 0;
  let beginDateAt: string | null = null;
  let endDateAt: string | null = null;
  let isCompanyOrder = false;
  let searchParams = {
    offset: 0,
  };
  let unifiedCustomerFilters: OrdersFiltersInput | undefined;
  let unifiedCustomerSortBy: OrdersSortInput | undefined;

  const id = useId();

  if (location?.state) {
    const state = location.state as LocationState;
    currentIndex = state?.currentIndex || 0;
    totalCount = state?.totalCount || 0;
    beginDateAt = state?.beginDateAt || null;
    endDateAt = state?.endDateAt || null;
    isCompanyOrder = state?.isCompanyOrder ?? false;
    searchParams = state?.searchParams || { offset: 0 };
    unifiedCustomerFilters = state?.unifiedCustomerFilters;
    unifiedCustomerSortBy = state?.unifiedCustomerSortBy;
  }

  const isUnifiedPath = totalCount === -1;

  const isUnifiedOrdersNonCompanyOrderPath = isUnifiedOrders && !isCompanyOrder;

  const fetchList = async () => {
    if (isUnifiedPath) return;
    setLoading(true);

    let flag = '';
    let rightId: number | string = '';
    let leftId: number | string = '';

    if (isUnifiedOrdersNonCompanyOrderPath) {
      // Cursor-based: fetch listIndex + 2 items from the start so that
      // edges[listIndex - 1] (prev) and edges[listIndex + 1] (next) are in the result.
      const result = await getCustomerOrders({
        first: listIndex + 2,
        filters: unifiedCustomerFilters,
        sortBy: unifiedCustomerSortBy ?? OrdersSortInput.CREATED_AT_NEWEST,
      });

      const edges = result.data?.customer?.orders?.edges ?? [];

      if (listIndex === 0) {
        flag = 'toLeft';
        rightId = edges[1]?.node.entityId ?? '';
      } else if (!edges[listIndex + 1]) {
        // No item after the current one — reached the end of the list.
        flag = 'toRight';
        leftId = edges[listIndex - 1]?.node.entityId ?? '';
      } else {
        leftId = edges[listIndex - 1]?.node.entityId ?? '';
        rightId = edges[listIndex + 1]?.node.entityId ?? '';
      }
    } else {
      const index = () => {
        if (listIndex) return listIndex - 1;
        return 0;
      };

      const searchDetailParams = {
        ...defaultSearchParams,
        ...searchParams,
        first: 3,
        offset: index(),
        beginDateAt: beginDateAt || null,
        endDateAt: endDateAt || null,
      };

      const { edges: list, totalCount: listTotal } = isB2BUser
        ? await getB2BAllOrders(searchDetailParams)
        : await getBCAllOrders(searchDetailParams);

      if (listIndex === listTotal - 1) {
        flag = 'toRight';
        leftId = list[list.length - 2]?.node.orderId || 0;
      } else if (listIndex === 0) {
        flag = 'toLeft';
        rightId = list[1]?.node.orderId || 0;
      } else {
        leftId = list[0]?.node.orderId || 0;
        rightId = list[2]?.node.orderId || 0;
      }
    }

    setRightLeftSide({ leftId, rightId });
    setArrived(flag);
    setLoading(false);
  };

  useEffect(() => {
    if (totalCount > 0) setListIndex(currentIndex);
    if (listIndex === initListIndex) return;
    const searchPageStart = currentIndex + (searchParams.offset || 0);
    setListIndex(searchPageStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (listIndex === initListIndex) return;
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listIndex]);

  if (JSON.stringify(searchParams) === '{}') return null;

  // The unified SF GQL path sets totalCount to -1 because collectionInfo is
  // not available on OrdersConnection. Detail-level prev/next navigation
  // requires fetching adjacent orders which the cursor-based API doesn't
  // support in the same way. B2B-4629 (4f) will implement cursor-based
  // detail navigation. Until then, hide this component in the unified path.
  if (isUnifiedPath) return null;

  const handleBeforePage = () => {
    setListIndex(listIndex - 1);
    onChange(rightLeftSide.leftId);
  };

  const handleNextPage = () => {
    setListIndex(listIndex + 1);
    onChange(rightLeftSide.rightId);
  };
  const index = listIndex + 1;

  const isPrevDisabled = isUnifiedOrdersNonCompanyOrderPath
    ? arrived === 'toLeft' || loading
    : totalCount <= 1 || arrived === 'toLeft' || loading;

  const isNextDisabled = isUnifiedOrdersNonCompanyOrderPath
    ? arrived === 'toRight' || loading
    : totalCount <= 1 || arrived === 'toRight' || loading;

  const showOrderPositionLabel = !isMobile && !isUnifiedOrdersNonCompanyOrderPath;

  return (
    <Box
      role="navigation"
      aria-labelledby={showOrderPositionLabel ? id : undefined}
      sx={{
        display: 'flex',
        color,
      }}
    >
      {showOrderPositionLabel && (
        <Box
          id={id}
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {b3Lang('orderDetail.pagination.order')}
          <Typography
            sx={{
              m: 1,
            }}
          >
            {index}
          </Typography>
          {b3Lang('orderDetail.pagination.of')}
          <Box
            sx={{
              ml: 1,
            }}
          >
            {totalCount}
          </Box>
        </Box>
      )}

      <IconButton onClick={handleBeforePage} disabled={isPrevDisabled}>
        <NavigateBeforeIcon sx={{ color }} />
      </IconButton>
      <IconButton onClick={handleNextPage} disabled={isNextDisabled}>
        <NavigateNextIcon sx={{ color }} />
      </IconButton>
    </Box>
  );
}
