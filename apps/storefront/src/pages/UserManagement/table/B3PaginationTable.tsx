import {
  ReactElement,
  Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import isEmpty from 'lodash-es/isEmpty';
import isEqual from 'lodash-es/isEqual';

import { useMobile } from '@/hooks/useMobile';
import { useAppSelector } from '@/store';
import { forwardRefWithGenerics } from '@/utils/forwardRefWithGenerics';
import { memoWithGenerics } from '@/utils/memoWithGenerics';

import { B3Table, isNodeWrapper, PossibleNodeWrapper, WithRowControls } from './B3Table';

interface TablePagination {
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

interface B3PaginationTableProps<GetRequestListParams, Row extends object> {
  itemXs: number;
  renderItem: (row: Row, index?: number, checkBox?: () => ReactElement) => ReactElement;
  getRequestList: GetRequestList<GetRequestListParams, WithRowControls<Row>>;
  searchParams: GetRequestListParams & { createdBy?: string };
  requestLoading?: (bool: boolean) => void;
  showRowsPerPageOptions?: boolean;
}

function PaginationTable<GetRequestListParams, Row extends object>(
  {
    renderItem,
    itemXs,
    getRequestList,
    searchParams,
    requestLoading,
    showRowsPerPageOptions = true,
  }: B3PaginationTableProps<GetRequestListParams, Row>,
  ref?: Ref<unknown>,
) {
  const rowsPerPageOptions = [12, 24, 36];
  const initPagination = {
    offset: 0,
    first: rowsPerPageOptions[0],
  };

  const { selectCompanyHierarchyId } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );
  const selectCompanyHierarchyIdCache = useRef(selectCompanyHierarchyId);

  const cache = useRef<GetRequestListParams | null>(null);

  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState<TablePagination>(initPagination);

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
        if (cache?.current && isEqual(cache.current, searchParams) && !isRefresh && !b3Pagination) {
          return;
        }
        cache.current = searchParams;

        setLoading(true);
        if (requestLoading) requestLoading(true);
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
        setLoading(false);
        if (requestLoading) requestLoading(false);
      } catch (e) {
        setLoading(false);
        if (requestLoading) requestLoading(false);
      }
    },
    [cacheList, getRequestList, pagination.first, requestLoading, searchParams],
  );

  const refresh = useCallback(() => {
    fetchList(pagination, true);
  }, [fetchList, pagination]);

  useEffect(() => {
    const isChangeCompany =
      Number(selectCompanyHierarchyIdCache.current) !== Number(selectCompanyHierarchyId);
    if (!isEmpty(searchParams)) {
      if (isChangeCompany) {
        fetchList(pagination, true);
        selectCompanyHierarchyIdCache.current = selectCompanyHierarchyId;
      } else {
        fetchList();
      }
    }
    // ignore pageType because is not a reactive value
  }, [fetchList, searchParams, selectCompanyHierarchyId, pagination]);

  const handlePaginationChange = async (pagination: TablePagination) => {
    await fetchList(pagination);
    setPagination(pagination);
  };

  const tablePagination = {
    ...pagination,
    count,
  };

  const getList = useCallback(() => list, [list]);

  const getCacheList = useCallback(() => cacheAllList, [cacheAllList]);

  useImperativeHandle(
    ref,
    () => ({
      setList,
      setCacheAllList,
      getList,
      getCacheList,
      refresh,
    }),
    [getList, getCacheList, refresh],
  );

  return (
    <B3Table
      listItems={list}
      pagination={tablePagination}
      rowsPerPageOptions={rowsPerPageOptions}
      onPaginationChange={handlePaginationChange}
      isInfiniteScroll={isMobile}
      isLoading={loading}
      renderItem={renderItem}
      itemXs={itemXs}
      showRowsPerPageOptions={showRowsPerPageOptions}
    />
  );
}

const B3PaginationTable = memoWithGenerics(forwardRefWithGenerics(PaginationTable));

export { B3PaginationTable };
