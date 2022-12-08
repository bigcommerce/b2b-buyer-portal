import {
  ReactNode,
  ReactElement,
  useState,
  useEffect,
} from 'react'

import {
  useMobile,
} from '@/hooks'

import {
  B3Table,
} from './B3Table'

export interface TablePagination {
  offset: number,
  first: number,
}

export interface TableColumnItem<T> {
  key: string,
  title: string,
  width?: string,
  render?: (item: T, index: number) => ReactNode,
}

interface B3PaginationTableProps<T, Y> {
  tableFixed?: boolean,
  tableHeaderHide?: boolean,
  columnItems?: TableColumnItem<T>[],
  itemSpacing?: number,
  itemXs?: number,
  pagination?: TablePagination,
  rowsPerPageOptions?: number[],
  showPagination?: boolean,
  renderItem?: (row: T, index: number) => ReactElement,
  isCustomRender?: boolean,
  infiniteScrollThreshold?: number,
  infiniteScrollNode?: HTMLElement,
  infiniteScrollLoader?: ReactElement,
  infiniteScrollHeight?: string,
  noDataText?: string,
  tableKey?: string,
  getRequestList: (params: Y) => CustomFieldItems,
  searchParams: Y,
  requestKey: string,
  requestLoading?: (bool: boolean) => void,
}

export const B3PaginationTable:<T, Y>(props: B3PaginationTableProps<T, Y>) => ReactElement = ({
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
  infiniteScrollThreshold,
  infiniteScrollNode,
  infiniteScrollLoader,
  infiniteScrollHeight,
  getRequestList,
  searchParams,
  requestKey,
  requestLoading,
}) => {
  const initPagination = {
    offset: 0,
    first: rowsPerPageOptions[0],
  }

  const [loading, setLoading] = useState<boolean>()

  const [pagination, setPagination] = useState<TablePagination>(initPagination)

  const [count, setAllCount] = useState<number>(0)

  const [list, setList] = useState<any[]>([])

  const [isMobile] = useMobile()

  const fetchList = async (isInitPagination = false) => {
    try {
      setLoading(true)
      if (requestLoading) requestLoading(true)
      const params = {
        ...searchParams,
        first: pagination.first,
        offset: isInitPagination ? 0 : pagination.offset,
      }
      const requestList = await getRequestList(params)
      const {
        edges, totalCount,
      } = requestList[requestKey]

      if (isMobile) {
        const newList = pagination.offset > 0 ? [...list, ...edges] : [...edges]
        setList(newList)
      } else {
        setList(edges)
      }

      setAllCount(totalCount)
    } finally {
      setLoading(false)
      if (requestLoading) requestLoading(false)
    }
  }

  useEffect(() => {
    fetchList(true)
  }, [searchParams])

  useEffect(() => {
    fetchList()
  }, [pagination])

  const handlePaginationChange = (pagination: TablePagination) => {
    setPagination(pagination)
  }

  const tablePagination = {
    ...pagination,
    count,
  }

  return (
    <B3Table
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
      infiniteScrollThreshold={infiniteScrollThreshold}
      infiniteScrollNode={infiniteScrollNode}
      infiniteScrollLoader={infiniteScrollLoader}
      infiniteScrollHeight={infiniteScrollHeight}
    />
  )
}
