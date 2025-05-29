import { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import isEmpty from 'lodash-es/isEmpty';
import isEqual from 'lodash-es/isEqual';

import { useMobile } from '@/hooks';
import { useAppSelector } from '@/store';
import { memoWithGenerics } from '@/utils';

import {
  B3Table,
  isNodeWrapper,
  PossibleNodeWrapper,
  TableColumnItem,
  WithRowControls,
} from './B3Table';

export interface TablePagination {
  offset: number;
  first: number;
}

interface GetRequestListResult<T extends object> {
  edges: PossibleNodeWrapper<T>[];
  totalCount: number;
}

type GetRequestListSync<Params, Item extends object> = (
  params: Params,
) => GetRequestListResult<Item>;
type GetRequestListAsync<Params, Item extends object> = (
  params: Params,
) => Promise<GetRequestListResult<Item>>;

export type GetRequestList<Params, Item extends object> =
  | GetRequestListSync<Params, Item>
  | GetRequestListAsync<Params, Item>;

interface B3PaginationTableProps<GetRequestListParams, Row extends Record<'orderId', string>> {
  columnItems?: TableColumnItem<Row>[];
  renderItem?: (row: Row, index?: number) => ReactElement;
  getRequestList: GetRequestList<GetRequestListParams, WithRowControls<Row>>;
  searchParams: GetRequestListParams & { createdBy?: string };
  requestLoading: (bool: boolean) => void;
  onClickRow: (row: Row, index: number) => void;
  sortDirection?: 'asc' | 'desc';
  sortByFn?: (e: { key: string }) => void;
  orderBy?: string;
  isAutoRefresh?: boolean;
}

function PaginationTable<GetRequestListParams, Row extends Record<'orderId', string>>({
  columnItems,
  getRequestList,
  searchParams,
  requestLoading,
  isAutoRefresh = true,
  sortDirection = 'asc',
  orderBy = '',
  sortByFn = () => {},
  renderItem,
  onClickRow,
}: B3PaginationTableProps<GetRequestListParams, Row>) {
  const { selectCompanyHierarchyId } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );
  const selectCompanyHierarchyIdCache = useRef(selectCompanyHierarchyId);

  const cache = useRef<GetRequestListParams | null>(null);

  const [pagination, setPagination] = useState<TablePagination>({
    offset: 0,
    first: 10,
  });

  const [count, setAllCount] = useState<number>(0);

  const [cacheAllList, setCacheAllList] = useState<PossibleNodeWrapper<WithRowControls<Row>>[]>([]);

  const [list, setList] = useState<PossibleNodeWrapper<WithRowControls<Row>>[]>([]);

  const [isMobile] = useMobile();

  const cacheList = useCallback(
    (edges: PossibleNodeWrapper<WithRowControls<Row>>[]) => {
      if (!cacheAllList.length) setCacheAllList(edges);

      const copyCacheAllList = [...cacheAllList];

      edges.forEach((item) => {
        const option = isNodeWrapper(item) ? item.node : item;
        const isExist = cacheAllList.some((cache) => {
          const cacheOption = isNodeWrapper(cache) ? cache.node : cache;
          return cacheOption.id === option.id;
        });

        if (!isExist) {
          copyCacheAllList.push(item);
        }
      });

      setCacheAllList(copyCacheAllList);
    },
    [cacheAllList],
  );

  const fetchList = useCallback(
    async (b3Pagination?: TablePagination, isRefresh?: boolean) => {
      try {
        if (cache.current && isEqual(cache.current, searchParams) && !isRefresh && !b3Pagination) {
          return;
        }
        cache.current = searchParams;

        requestLoading(true);
        const { createdBy = '' } = searchParams;

        const getEmailReg = /\((.+)\)/g;
        const getCreatedByReg = /^[^(]+/;
        const emailRegArr = getEmailReg.exec(createdBy);
        const createdByUserRegArr = getCreatedByReg.exec(createdBy);
        const createdByUser = createdByUserRegArr?.length ? createdByUserRegArr[0].trim() : '';
        const newSearchParams = {
          ...searchParams,
          createdBy: createdByUser,
          email: emailRegArr?.length ? emailRegArr[1] : '',
        };
        const params = {
          ...newSearchParams,
          first: b3Pagination?.first || pagination.first,
          offset: b3Pagination?.offset || 0,
        };
        const requestList = await getRequestList(params);
        const { edges, totalCount } = requestList;

        setList(edges);

        cacheList(edges);

        if (!b3Pagination) {
          setPagination({
            first: pagination.first,
            offset: 0,
          });
        }

        setAllCount(totalCount);
        requestLoading(false);
      } catch (e) {
        requestLoading(false);
      }
    },
    [cacheList, getRequestList, pagination.first, requestLoading, searchParams],
  );

  useEffect(() => {
    const isChangeCompany =
      Number(selectCompanyHierarchyIdCache.current) !== Number(selectCompanyHierarchyId);
    if (!isEmpty(searchParams)) {
      if (isChangeCompany) {
        if (isAutoRefresh) fetchList(pagination, true);
        selectCompanyHierarchyIdCache.current = selectCompanyHierarchyId;
      } else {
        if (isAutoRefresh) fetchList(pagination, true);
        fetchList();
      }
    }
  }, [fetchList, searchParams, selectCompanyHierarchyId, pagination, isAutoRefresh]);

  const handlePaginationChange = async (pagination: TablePagination) => {
    await fetchList(pagination);
    setPagination(pagination);
  };

  const tablePagination = {
    ...pagination,
    count,
  };

  return (
    <B3Table
      columnItems={columnItems || []}
      listItems={list}
      pagination={tablePagination}
      onPaginationChange={handlePaginationChange}
      isInfiniteScroll={isMobile}
      renderItem={renderItem}
      onClickRow={onClickRow}
      sortDirection={sortDirection}
      sortByFn={sortByFn}
      orderBy={orderBy}
    />
  );
}

const B3PaginationTable = memoWithGenerics(PaginationTable);

export { B3PaginationTable };
