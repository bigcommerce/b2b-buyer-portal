import {
  ReactElement,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  Ref,
  memo,
} from 'react'

import {
  useMobile,
} from '@/hooks'

import {
  B3Table,
  TableColumnItem,
} from './B3Table'

export interface TablePagination {
  offset: number,
  first: number,
}

// export interface TableColumnItem {
//   key: string,
//   title: string,
//   width?: string,
//   render?: (item: CustomFieldItems, index: number) => ReactNode,
// }

interface B3PaginationTableProps {
  tableFixed?: boolean,
  tableHeaderHide?: boolean,
  columnItems?: TableColumnItem<any>[],
  itemSpacing?: number,
  itemXs?: number,
  rowsPerPageOptions?: number[],
  showPagination?: boolean,
  renderItem?: (row: any, index?: number, checkBox?: () => ReactElement) => ReactElement,
  isCustomRender?: boolean,
  infiniteScrollThreshold?: number,
  infiniteScrollNode?: HTMLElement,
  infiniteScrollLoader?: ReactElement,
  infiniteScrollHeight?: string,
  noDataText?: string,
  tableKey?: string,
  getRequestList: any,
  searchParams?: any,
  requestLoading?: (bool: boolean) => void,
  showCheckbox?: boolean,
  selectedSymbol?: string,
  showBorder?: boolean,
  getSelectCheckbox?: (arr: Array<string | number>) => void,
  hover?: boolean,
  labelRowsPerPage?: string,
  itemIsMobileSpacing?: number,
  disableCheckbox?: boolean,
  onClickRow?: (item: any, index?: number) => void,
  showRowsPerPageOptions?: boolean,
}

const PaginationTable:(props: B3PaginationTableProps) => ReactElement = ({
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
  requestLoading,
  showCheckbox = false,
  selectedSymbol = 'id',
  showBorder = true,
  getSelectCheckbox,
  hover = false,
  labelRowsPerPage = '',
  itemIsMobileSpacing = 2,
  disableCheckbox = false,
  onClickRow,
  showPagination = true,
  showRowsPerPageOptions = true,
}, ref?: Ref<unknown>) => {
  const initPagination = {
    offset: 0,
    first: rowsPerPageOptions[0],
  }

  const [loading, setLoading] = useState<boolean>()

  const [pagination, setPagination] = useState<TablePagination>(initPagination)

  const [count, setAllCount] = useState<number>(0)

  const [list, setList] = useState<Array<CustomFieldItems>>([])

  const [selectCheckbox, setSelectCheckbox] = useState<Array<string | number>>([])

  const [isMobile] = useMobile()

  const fetchList = async (b3Pagination?: TablePagination) => {
    try {
      setLoading(true)
      if (requestLoading) requestLoading(true)
      const {
        createdBy,
      } = searchParams

      const getEmailReg: RegExp = /\((.+)\)/g
      const getCreatedByReg: RegExp = /^[^(]+/
      const emailRegArr = getEmailReg.exec(createdBy)
      const createdByUserRegArr = getCreatedByReg.exec(createdBy)
      const createdByUser = createdByUserRegArr?.length ? createdByUserRegArr[0].trim() : ''
      const newSearchParams = {
        ...searchParams,
        createdBy: createdByUser,
        email: emailRegArr?.length ? emailRegArr[1] : '',
      }
      const params = {
        ...newSearchParams,
        first: b3Pagination?.first || pagination.first,
        offset: b3Pagination?.offset || 0,
      }
      const requestList = await getRequestList(params)
      const {
        edges, totalCount,
      }: CustomFieldItems = requestList

      setList(edges)
      setSelectCheckbox([])

      if (!b3Pagination) {
        setPagination({
          first: pagination.first,
          offset: 0,
        })
      }

      setAllCount(totalCount)
    } finally {
      setLoading(false)
      if (requestLoading) requestLoading(false)
    }
  }

  useEffect(() => {
    if (JSON.stringify(searchParams) !== '{}') {
      fetchList()
    }
  }, [searchParams])

  useEffect(() => {
    if (getSelectCheckbox) getSelectCheckbox(selectCheckbox)
  }, [selectCheckbox, list])

  const handlePaginationChange = (pagination: TablePagination) => {
    setPagination(pagination)
    fetchList(pagination)
  }

  const tablePagination = {
    ...pagination,
    count,
  }

  const getSelectedValue = () => ({
    selectCheckbox,
  })

  const getList = () => list

  useImperativeHandle(ref, () => ({
    getSelectedValue,
    setList,
    getList,
  }))

  const handleSelectAllItems = () => {
    if (selectCheckbox.length === list.length) {
      setSelectCheckbox([])
    } else {
      const selects: Array<string | number> = []
      list.forEach((item: CustomFieldItems) => {
        const option = item?.node || item
        if (option) {
          selects.push(option[selectedSymbol])
        }
      })
      setSelectCheckbox(selects)
    }
  }

  const handleSelectOneItem = (id: string | number) => {
    const selects = [...selectCheckbox]
    const index = selects.indexOf(id)
    if (index !== -1) {
      selects.splice(index, 1)
    } else {
      selects.push(id)
    }
    setSelectCheckbox(selects)
  }

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
      infiniteScrollThreshold={infiniteScrollThreshold}
      infiniteScrollNode={infiniteScrollNode}
      infiniteScrollLoader={infiniteScrollLoader}
      infiniteScrollHeight={infiniteScrollHeight}
      showCheckbox={showCheckbox}
      disableCheckbox={disableCheckbox}
      selectedSymbol={selectedSymbol}
      selectCheckbox={selectCheckbox}
      handleSelectAllItems={handleSelectAllItems}
      handleSelectOneItem={handleSelectOneItem}
      showBorder={showBorder}
      labelRowsPerPage={labelRowsPerPage}
      onClickRow={onClickRow}
      showPagination={showPagination}
      showRowsPerPageOptions={showRowsPerPageOptions}
    />
  )
}

const B3PaginationTable = memo(forwardRef(PaginationTable))

export {
  B3PaginationTable,
}
