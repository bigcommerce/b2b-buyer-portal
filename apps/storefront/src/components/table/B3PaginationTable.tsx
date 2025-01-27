import {
  forwardRef,
  memo,
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

import { B3Table, TableColumnItem } from './B3Table';

export interface TablePagination {
  offset: number;
  first: number;
}
interface B3PaginationTableProps {
  tableFixed?: boolean;
  tableHeaderHide?: boolean;
  columnItems?: TableColumnItem<any>[];
  itemSpacing?: number;
  itemXs?: number;
  rowsPerPageOptions?: number[];
  showPagination?: boolean;
  renderItem?: (row: any, index?: number, checkBox?: () => ReactElement) => ReactElement;
  CollapseComponent?: (row: any) => ReactElement;
  isCustomRender?: boolean;
  noDataText?: string;
  tableKey?: string;
  getRequestList: any;
  searchParams?: any;
  requestLoading?: (bool: boolean) => void;
  showCheckbox?: boolean;
  showSelectAllCheckbox?: boolean;
  selectedSymbol?: string;
  isSelectOtherPageCheckbox?: boolean;
  showBorder?: boolean;
  getSelectCheckbox?: (arr: Array<string | number>) => void;
  hover?: boolean;
  labelRowsPerPage?: string;
  itemIsMobileSpacing?: number;
  disableCheckbox?: boolean;
  applyAllDisableCheckbox?: boolean;
  onClickRow?: (item: any, index?: number) => void;
  showRowsPerPageOptions?: boolean;
  sortDirection?: 'asc' | 'desc';
  sortByFn?: (e: { key: string }) => void;
  orderBy?: string;
  pageType?: string;
  isAutoRefresh?: boolean;
}

function PaginationTable(
  {
    columnItems,
    isCustomRender = false,
    tableKey,
    renderItem,
    noDataText = '',
    tableFixed = false,
    tableHeaderHide = false,
    rowsPerPageOptions = [10, 20, 30],
    itemSpacing = 2,
    itemXs = 4,
    getRequestList,
    searchParams,
    requestLoading,
    showCheckbox = false,
    showSelectAllCheckbox = false,
    selectedSymbol = 'id',
    isSelectOtherPageCheckbox = false,
    showBorder = true,
    getSelectCheckbox,
    hover = false,
    labelRowsPerPage = '',
    itemIsMobileSpacing = 2,
    disableCheckbox = false,
    onClickRow,
    showPagination = true,
    showRowsPerPageOptions = true,
    CollapseComponent,
    applyAllDisableCheckbox = true,
    sortDirection = 'asc',
    sortByFn = () => {},
    orderBy = '',
    pageType = '',
    isAutoRefresh = true,
  }: B3PaginationTableProps,
  ref?: Ref<unknown>,
) {
  const initPagination = {
    offset: 0,
    first: rowsPerPageOptions[0],
  };

  const { selectCompanyHierarchyId } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );
  const selectCompanyHierarchyIdCache = useRef(selectCompanyHierarchyId);

  const cache = useRef(null);

  const [loading, setLoading] = useState<boolean>();

  const [pagination, setPagination] = useState<TablePagination>(initPagination);

  const [count, setAllCount] = useState<number>(0);

  const [isAllSelect, setAllSelect] = useState<boolean>(false);

  const [cacheAllList, setCacheAllList] = useState<Array<CustomFieldItems>>([]);

  const [list, setList] = useState<Array<CustomFieldItems>>([]);

  const [selectCheckbox, setSelectCheckbox] = useState<Array<string | number>>([]);

  const [isMobile] = useMobile();

  const cacheList = useCallback(
    (edges: Array<CustomFieldItems>) => {
      if (!cacheAllList.length) setCacheAllList(edges);

      const copyCacheAllList = [...cacheAllList];

      edges.forEach((item: CustomFieldItems) => {
        const option = item?.node || item;
        const isExist = cacheAllList.some((cache: CustomFieldItems) => {
          const cacheOption = cache?.node || cache;
          return cacheOption[selectedSymbol] === option[selectedSymbol];
        });

        if (!isExist) {
          copyCacheAllList.push(item);
        }
      });

      setCacheAllList(copyCacheAllList);
    },
    [cacheAllList, selectedSymbol],
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
        const { createdBy } = searchParams;

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
        const { edges, totalCount }: CustomFieldItems = requestList;

        setList(edges);

        cacheList(edges);

        if (!isSelectOtherPageCheckbox) setSelectCheckbox([]);

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
    [
      cacheList,
      getRequestList,
      isSelectOtherPageCheckbox,
      pagination.first,
      requestLoading,
      searchParams,
    ],
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
        if (isAutoRefresh && pageType === 'orderListPage') fetchList(pagination, true);
        fetchList();
      }
    }
    // ignore pageType because is not a reactive value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchList, searchParams, selectCompanyHierarchyId, pagination, isAutoRefresh]);

  useEffect(() => {
    if (getSelectCheckbox) getSelectCheckbox(selectCheckbox);
    // disabling as getSelectCheckbox will trigger rerenders if the user passes a function that is not memoized
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectCheckbox, list]);

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

  const getCurrentAllItemsSelect = useCallback(() => {
    if (!selectCheckbox.length) return false;
    return list.every((item: CustomFieldItems) => {
      const option = item?.node || item;

      return selectCheckbox.includes(option[selectedSymbol]);
    });
  }, [list, selectCheckbox, selectedSymbol]);

  useEffect(() => {
    if (isSelectOtherPageCheckbox) {
      const flag = getCurrentAllItemsSelect();
      setAllSelect(flag);
    }
  }, [selectCheckbox, pagination, isSelectOtherPageCheckbox, getCurrentAllItemsSelect]);

  const handleSelectAllItems = () => {
    const singlePageCheckbox = () => {
      if (selectCheckbox.length === list.length) {
        setSelectCheckbox([]);
      } else {
        const selects: Array<string | number> = [];
        list.forEach((item: CustomFieldItems) => {
          const option = item?.node || item;
          if (option) {
            if (pageType === 'shoppingListDetailsTable') {
              selects.push(
                option.quantity > 0 || !option.disableCurrentCheckbox ? option[selectedSymbol] : '',
              );
            } else {
              selects.push(option[selectedSymbol]);
            }
          }
        });
        setSelectCheckbox(selects);
      }
    };

    const otherPageCheckbox = () => {
      const flag = getCurrentAllItemsSelect();

      const newSelectCheckbox = [...selectCheckbox];
      if (flag) {
        list.forEach((item: CustomFieldItems) => {
          const option = item?.node || item;
          const index = newSelectCheckbox.findIndex((item: any) => item === option[selectedSymbol]);
          newSelectCheckbox.splice(index, 1);
        });
      } else {
        list.forEach((item: CustomFieldItems) => {
          const option = item?.node || item;
          if (!selectCheckbox.includes(option[selectedSymbol])) {
            newSelectCheckbox.push(option[selectedSymbol]);
          }
        });
      }

      setSelectCheckbox(newSelectCheckbox);
    };

    if (isSelectOtherPageCheckbox) {
      otherPageCheckbox();
    } else {
      singlePageCheckbox();
    }
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
      hover={hover}
      columnItems={columnItems || []}
      listItems={list}
      pagination={tablePagination}
      rowsPerPageOptions={rowsPerPageOptions}
      onPaginationChange={handlePaginationChange}
      isCustomRender={isCustomRender}
      isInfiniteScroll={isMobile}
      isLoading={loading}
      renderItem={renderItem}
      tableFixed={tableFixed}
      tableHeaderHide={tableHeaderHide}
      itemSpacing={itemSpacing}
      itemXs={itemXs}
      noDataText={noDataText}
      tableKey={tableKey}
      itemIsMobileSpacing={itemIsMobileSpacing}
      showCheckbox={showCheckbox}
      showSelectAllCheckbox={showSelectAllCheckbox}
      disableCheckbox={disableCheckbox}
      selectedSymbol={selectedSymbol}
      isSelectOtherPageCheckbox={isSelectOtherPageCheckbox}
      isAllSelect={isAllSelect}
      selectCheckbox={selectCheckbox}
      handleSelectAllItems={handleSelectAllItems}
      handleSelectOneItem={handleSelectOneItem}
      showBorder={showBorder}
      labelRowsPerPage={labelRowsPerPage}
      onClickRow={onClickRow}
      showPagination={showPagination}
      showRowsPerPageOptions={showRowsPerPageOptions}
      CollapseComponent={CollapseComponent}
      applyAllDisableCheckbox={applyAllDisableCheckbox}
      sortDirection={sortDirection}
      sortByFn={sortByFn}
      orderBy={orderBy}
    />
  );
}

const B3PaginationTable = memo(forwardRef(PaginationTable));

export { B3PaginationTable };
