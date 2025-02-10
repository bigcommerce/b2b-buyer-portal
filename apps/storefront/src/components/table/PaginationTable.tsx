import { FC, ReactElement, useCallback, useEffect, useState } from 'react';

import { useMobile } from '@/hooks';

import { B3Table, isNodeWrapper, PossibleNodeWrapper, TableColumnItem } from './B3Table';

export interface TablePagination {
  offset: number;
  first: number;
}

interface PaginationTableProps<Row extends object> {
  tableFixed?: boolean;
  tableHeaderHide?: boolean;
  columnItems: TableColumnItem<Row>[];
  itemSpacing?: number;
  itemXs?: number;
  rowsPerPageOptions?: number[];
  showPagination?: boolean;
  renderItem?: (row: Row, index?: number, checkBox?: () => ReactElement) => ReactElement;
  CollapseComponent?: FC<{ row: Row }>;
  isCustomRender?: boolean;
  noDataText?: string;
  tableKey?: string;
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
  onClickRow?: (item: Row, index?: number) => void;
  showRowsPerPageOptions?: boolean;
  sortDirection?: 'asc' | 'desc';
  sortByFn?: (e: { key: string }) => void;
  orderBy?: string;
  pageType?: string;
  items: PossibleNodeWrapper<Row>[];
}

function PaginationTable<Row extends object>({
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
  items,
}: PaginationTableProps<Row>) {
  const initPagination = {
    offset: 0,
    first: rowsPerPageOptions[0],
  };

  const [pagination, setPagination] = useState<TablePagination>(initPagination);

  const [isAllSelect, setAllSelect] = useState<boolean>(false);

  const [selectCheckbox, setSelectCheckbox] = useState<Array<string | number>>([]);

  const [isMobile] = useMobile();

  useEffect(() => {
    if (getSelectCheckbox) getSelectCheckbox(selectCheckbox);
    // disabling as getSelectCheckbox will trigger rerenders if the user passes a function that is not memoized
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectCheckbox, items]);

  const handlePaginationChange = async (pagination: TablePagination) => {
    setPagination(pagination);
  };

  const tablePagination = {
    ...pagination,
    count: items.length,
  };

  const getCurrentAllItemsSelect = useCallback(() => {
    if (!selectCheckbox.length) return false;
    return items.every((item) => {
      const option = isNodeWrapper(item) ? item.node : item;

      // @ts-expect-error typed previously as an any
      return selectCheckbox.includes(option[selectedSymbol]);
    });
  }, [items, selectCheckbox, selectedSymbol]);

  useEffect(() => {
    if (isSelectOtherPageCheckbox) {
      const flag = getCurrentAllItemsSelect();
      setAllSelect(flag);
    }
  }, [selectCheckbox, pagination, isSelectOtherPageCheckbox, getCurrentAllItemsSelect]);

  const handleSelectAllItems = () => {
    const singlePageCheckbox = () => {
      if (selectCheckbox.length === items.length) {
        setSelectCheckbox([]);
      } else {
        const selects: Array<string | number> = [];
        items.forEach((item) => {
          const option = isNodeWrapper(item) ? item.node : item;
          if (option) {
            if (pageType === 'shoppingListDetailsTable') {
              selects.push(
                // @ts-expect-error typed previously as an any
                option.quantity > 0 || !option.disableCurrentCheckbox ? option[selectedSymbol] : '',
              );
            } else {
              // @ts-expect-error typed previously as an any
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
        items.forEach((item) => {
          const option = isNodeWrapper(item) ? item.node : item;
          // @ts-expect-error typed previously as an any
          const index = newSelectCheckbox.findIndex((item) => item === option[selectedSymbol]);
          newSelectCheckbox.splice(index, 1);
        });
      } else {
        items.forEach((item) => {
          const option = isNodeWrapper(item) ? item.node : item;
          // @ts-expect-error typed previously as an any
          if (!selectCheckbox.includes(option[selectedSymbol])) {
            // @ts-expect-error typed previously as an any
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
      listItems={items.slice(pagination.offset, pagination.offset + pagination.first)}
      pagination={tablePagination}
      rowsPerPageOptions={rowsPerPageOptions}
      onPaginationChange={handlePaginationChange}
      isCustomRender={isCustomRender}
      isInfiniteScroll={isMobile}
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

export default PaginationTable;
