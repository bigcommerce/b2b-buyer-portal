import { useCallback, useMemo, useState } from 'react';

import { PageInfo } from '@/shared/service/bc/graphql/base';

interface CursorPaginationState {
  after?: string;
  before?: string;
}

interface PaginationVariables {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

// Must stay in sync with rowsPerPageOptions in order/table/B3Table.tsx ([10, 20, 30]).
const DEFAULT_PAGE_SIZE = 10;

export interface UseUnifiedOrdersPaginationResult {
  paginationVariables: PaginationVariables;
  pageSize: number;
  pageInfo: PageInfo | null;
  currentPage: number;
  b3TablePaginationProps: {
    pagination: { offset: number; first: number; count: number };
    cursorPageInfo: { hasNextPage: boolean; hasPreviousPage: boolean };
    onPaginationChange: (newPagination: { offset: number; first: number }) => void;
  };
  resetPagination: () => void;
  handlePageChange: (direction: 'next' | 'prev') => void;
  handlePageSizeChange: (size: number) => void;
  updatePageInfo: (info: PageInfo) => void;
}

export const useUnifiedOrdersPagination = (): UseUnifiedOrdersPaginationResult => {
  const [cursors, setCursors] = useState<CursorPaginationState>({});
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const paginationVariables = useMemo<PaginationVariables>(
    () =>
      cursors.before
        ? { last: pageSize, before: cursors.before }
        : { first: pageSize, after: cursors.after },
    [cursors, pageSize],
  );

  const resetPagination = useCallback(() => {
    setCursors({});
    setCurrentPage(0);
    setPageInfo(null);
  }, []);

  const handlePageChange = useCallback(
    (direction: 'next' | 'prev') => {
      if (direction === 'next' && pageInfo?.hasNextPage && pageInfo.endCursor) {
        if (cursors.after === pageInfo.endCursor) return;
        setCursors({ after: pageInfo.endCursor });
        setCurrentPage((prev) => prev + 1);
      } else if (direction === 'prev' && pageInfo?.hasPreviousPage && pageInfo.startCursor) {
        if (cursors.before === pageInfo.startCursor) return;
        setCursors({ before: pageInfo.startCursor });
        setCurrentPage((prev) => Math.max(0, prev - 1));
      }
    },
    [pageInfo, cursors],
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size);
      resetPagination();
    },
    [resetPagination],
  );

  const updatePageInfo = useCallback((info: PageInfo) => {
    setPageInfo(info);
  }, []);

  const b3TablePaginationProps = useMemo(
    () => ({
      pagination: { offset: currentPage * pageSize, first: pageSize, count: -1 },
      cursorPageInfo: {
        hasNextPage: pageInfo?.hasNextPage ?? false,
        hasPreviousPage: pageInfo?.hasPreviousPage ?? false,
      },
      onPaginationChange: (newPagination: { offset: number; first: number }) => {
        const newPage = newPagination.first === 0 ? 0 : newPagination.offset / newPagination.first;
        if (newPagination.first !== pageSize) {
          handlePageSizeChange(newPagination.first);
        } else if (newPage > currentPage) {
          handlePageChange('next');
        } else if (newPage < currentPage) {
          handlePageChange('prev');
        }
      },
    }),
    [currentPage, pageSize, pageInfo, handlePageChange, handlePageSizeChange],
  );

  return {
    paginationVariables,
    pageSize,
    pageInfo,
    currentPage,
    b3TablePaginationProps,
    resetPagination,
    handlePageChange,
    handlePageSizeChange,
    updatePageInfo,
  };
};
