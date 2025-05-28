import {
  FC,
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

import { useMobile } from '@/hooks';
import { useAppSelector } from '@/store';
import { forwardRefWithGenerics, memoWithGenerics } from '@/utils';

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

interface B3PaginationTableProps<GetRequestListParams, Row extends object> {
  columnItems?: TableColumnItem<Row>[];
  renderItem?: (row: Row, index?: number, checkBox?: () => ReactElement) => ReactElement;
  getRequestList: GetRequestList<GetRequestListParams, WithRowControls<Row>>;
  searchParams: GetRequestListParams & { createdBy?: string };
  requestLoading?: (bool: boolean) => void;
  onClickRow?: (row: Row, index?: number) => void;
  sortDirection?: 'asc' | 'desc';
  sortByFn?: (e: { key: string }) => void;
  orderBy?: string;
  isAutoRefresh?: boolean;
}

function PaginationTable<GetRequestListParams, Row extends object>(
  {
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
  }: B3PaginationTableProps<GetRequestListParams, Row>,
  ref?: Ref<unknown>,
) {
  const { selectCompanyHierarchyId } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );
  const selectCompanyHierarchyIdCache = useRef(selectCompanyHierarchyId);

  const cache = useRef<GetRequestListParams | null>(null);

  const [loading, setLoading] = useState<boolean>();

  const [pagination, setPagination] = useState<TablePagination>({
    offset: 0,
    first: 10,
  });

  const [count, setAllCount] = useState<number>(0);

  const [cacheAllList, setCacheAllList] = useState<PossibleNodeWrapper<WithRowControls<Row>>[]>([]);

  const [list, setList] = useState<PossibleNodeWrapper<WithRowControls<Row>>[]>([]);

  const [selectCheckbox, setSelectCheckbox] = useState<Array<string | number>>([]);

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

        setSelectCheckbox([]);

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
        if (isAutoRefresh) fetchList(pagination, true);
        selectCompanyHierarchyIdCache.current = selectCompanyHierarchyId;
      } else {
        if (isAutoRefresh) fetchList(pagination, true);
        fetchList();
      }
    }
    // ignore pageType because is not a reactive value
  }, [fetchList, searchParams, selectCompanyHierarchyId, pagination, isAutoRefresh]);

  const handlePaginationChange = async (pagination: TablePagination) => {
    await fetchList(pagination);
    setPagination(pagination);
  };

  const tablePagination = {
    ...pagination,
    count,
  };

  const getSelectedValue = useCallback(
    () => ({
      selectCheckbox,
    }),
    [selectCheckbox],
  );

  const getList = useCallback(() => list, [list]);

  const getCacheList = useCallback(() => cacheAllList, [cacheAllList]);

  useImperativeHandle(
    ref,
    () => ({
      getSelectedValue,
      setList,
      setCacheAllList,
      getList,
      getCacheList,
      refresh,
    }),
    [getList, getCacheList, getSelectedValue, refresh],
  );

  const handleSelectAllItems = () => {
    const singlePageCheckbox = () => {
      if (selectCheckbox.length === list.length) {
        setSelectCheckbox([]);
      } else {
        const selects: Array<string | number> = [];
        list.forEach((item) => {
          const option = isNodeWrapper(item) ? item.node : item;
          if (option) {
            // @ts-expect-error typed previously as an any
            selects.push(option.id);
          }
        });
        setSelectCheckbox(selects);
      }
    };

    singlePageCheckbox();
  };

  const handleSelectOneItem = (id: string | number) => {
    const selects = [...selectCheckbox];
    const index = selects.indexOf(id);
    if (index !== -1) {
      selects.splice(index, 1);
    } else {
      selects.push(id);
    }
    setSelectCheckbox(selects);
  };

  return (
    <B3Table
      hover
      columnItems={columnItems || []}
      listItems={list}
      pagination={tablePagination}
      rowsPerPageOptions={[10, 20, 30]}
      onPaginationChange={handlePaginationChange}
      isCustomRender={false}
      isInfiniteScroll={isMobile}
      isLoading={loading}
      renderItem={renderItem}
      tableFixed={false}
      tableHeaderHide={false}
      itemSpacing={2}
      itemXs={4}
      noDataText=""
      tableKey="orderId"
      itemIsMobileSpacing={2}
      showCheckbox={false}
      showSelectAllCheckbox={false}
      disableCheckbox={false}
      selectedSymbol="id"
      isSelectOtherPageCheckbox={false}
      isAllSelect={false}
      selectCheckbox={selectCheckbox}
      handleSelectAllItems={handleSelectAllItems}
      handleSelectOneItem={handleSelectOneItem}
      showBorder
      labelRowsPerPage=""
      onClickRow={onClickRow}
      showPagination
      showRowsPerPageOptions
      CollapseComponent={undefined}
      applyAllDisableCheckbox
      sortDirection={sortDirection}
      sortByFn={sortByFn}
      orderBy={orderBy}
    />
  );
}

const B3PaginationTable = memoWithGenerics(forwardRefWithGenerics(PaginationTable));

export { B3PaginationTable };
