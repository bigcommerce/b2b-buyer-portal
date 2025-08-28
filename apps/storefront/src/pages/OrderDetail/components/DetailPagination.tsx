import {
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { useEffect, useId, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useMobile } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import { getB2BAllOrders, getBCAllOrders } from '@/shared/service/b2b';
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
  searchParams?: SearchParamsProps;
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

function DetailPagination({ onChange, color }: DetailPageProps) {
  const b3Lang = useB3Lang();
  const isB2BUser = useAppSelector(isB2BUserSelector);
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
  let searchParams = {
    offset: 0,
  };

  const id = useId();

  if (location?.state) {
    const state = location.state as LocationState;

    currentIndex = state?.currentIndex || 0;
    totalCount = state?.totalCount || 0;
    beginDateAt = state?.beginDateAt || null;
    endDateAt = state?.endDateAt || null;
    searchParams = state?.searchParams || {
      offset: 0,
    };
  }

  const fetchList = async () => {
    setLoading(true);

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

    const { edges: list, totalCount } = isB2BUser
      ? await getB2BAllOrders(searchDetailParams)
      : await getBCAllOrders(searchDetailParams);

    let flag = '';

    let rightId = '';

    let leftId = '';

    if (listIndex === totalCount - 1) {
      flag = 'toRight';
      leftId = list[list.length - 2]?.node.orderId || 0;
    } else if (listIndex === 0) {
      flag = 'toLeft';
      rightId = list[1]?.node.orderId || 0;
    } else {
      leftId = list[0]?.node.orderId || 0;
      rightId = list[2]?.node.orderId || 0;
    }

    setRightLeftSide({
      leftId,
      rightId,
    });

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

  const handleBeforePage = () => {
    setListIndex(listIndex - 1);
    onChange(rightLeftSide.leftId);
  };

  const handleNextPage = () => {
    setListIndex(listIndex + 1);
    onChange(rightLeftSide.rightId);
  };

  const index = listIndex + 1;

  return (
    <Box
      aria-labelledby={id}
      role="navigation"
      sx={{
        display: 'flex',
        color,
      }}
    >
      {!isMobile && (
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

      <IconButton
        disabled={totalCount <= 1 || arrived === 'toLeft' || loading}
        onClick={handleBeforePage}
      >
        <NavigateBeforeIcon
          sx={{
            color,
          }}
        />
      </IconButton>
      <IconButton
        disabled={totalCount <= 1 || arrived === 'toRight' || loading}
        onClick={handleNextPage}
      >
        <NavigateNextIcon
          sx={{
            color,
          }}
        />
      </IconButton>
    </Box>
  );
}

export default DetailPagination;
