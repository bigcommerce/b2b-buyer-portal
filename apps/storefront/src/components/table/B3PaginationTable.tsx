import {
  forwardRef,
  memo,
  ReactElement,
  Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { isEmpty, isEqual } from 'lodash'

import { useMobile } from '@/hooks'

import { B3Table, TableColumnItem } from './B3Table'

export interface TablePagination {
  offset: number
  first: number
}

// export interface TableColumnItem {
//   key: string,
//   title: string,
//   width?: string,
//   render?: (item: CustomFieldItems, index: number) => ReactNode,
// }

interface B3PaginationTableProps {
  tableFixed?: boolean
  tableHeaderHide?: boolean
  columnItems?: TableColumnItem<any>[]
  itemSpacing?: number
  itemXs?: number
  rowsPerPageOptions?: number[]
  showPagination?: boolean
  renderItem?: (
    row: any,
    index?: number,
    checkBox?: () => ReactElement
  ) => ReactElement
  isCustomRender?: boolean
  noDataText?: string
  tableKey?: string
  getRequestList: any
  searchParams?: any
  requestLoading?: (bool: boolean) => void
  showCheckbox?: boolean
  selectedSymbol?: string
  isSelectOtherPageCheckbox?: boolean
  showBorder?: boolean
  getSelectCheckbox?: (arr: Array<string | number>) => void
  hover?: boolean
  labelRowsPerPage?: string
  itemIsMobileSpacing?: number
  disableCheckbox?: boolean
  onClickRow?: (item: any, index?: number) => void
  showRowsPerPageOptions?: boolean
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
  }: B3PaginationTableProps,
  ref?: Ref<unknown>
) {
  const initPagination = {
    offset: 0,
    first: rowsPerPageOptions[0],
  }

  const cache = useRef(null)

  const [loading, setLoading] = useState<boolean>()

  const [pagination, setPagination] = useState<TablePagination>(initPagination)

  const [count, setAllCount] = useState<number>(0)

  const [isAllSelect, setAllSelect] = useState<boolean>(false)

  const [cacheAllList, setCacheAllList] = useState<Array<CustomFieldItems>>([])

  const [list, setList] = useState<Array<CustomFieldItems>>([])

  const [selectCheckbox, setSelectCheckbox] = useState<Array<string | number>>(
    []
  )

  const [isMobile] = useMobile()

  const cacheList = (edges: Array<CustomFieldItems>) => {
    if (!cacheAllList.length) setCacheAllList(edges)

    const copyCacheAllList = [...cacheAllList]

    edges.forEach((item: CustomFieldItems) => {
      const option = item?.node || item
      const isExist = cacheAllList.some((cache: CustomFieldItems) => {
        const cacheOption = cache?.node || cache
        return cacheOption[selectedSymbol] === option[selectedSymbol]
      })

      if (!isExist) {
        copyCacheAllList.push(item)
      }
    })

    setCacheAllList(copyCacheAllList)
  }

  const fetchList = async (
    b3Pagination?: TablePagination,
    isRefresh?: boolean
  ) => {
    try {
      if (
        cache?.current &&
        isEqual(cache.current, searchParams) &&
        !isRefresh &&
        !b3Pagination
      ) {
        return
      }
      cache.current = searchParams

      setLoading(true)
      if (requestLoading) requestLoading(true)
      const { createdBy } = searchParams

      const getEmailReg = /\((.+)\)/g
      const getCreatedByReg = /^[^(]+/
      const emailRegArr = getEmailReg.exec(createdBy)
      const createdByUserRegArr = getCreatedByReg.exec(createdBy)
      const createdByUser = createdByUserRegArr?.length
        ? createdByUserRegArr[0].trim()
        : ''
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
      const { edges, totalCount }: CustomFieldItems = requestList

      setList(edges)

      cacheList(edges)

      if (!isSelectOtherPageCheckbox) setSelectCheckbox([])

      if (!b3Pagination) {
        setPagination({
          first: pagination.first,
          offset: 0,
        })
      }

      setAllCount(totalCount)
      setLoading(false)
      if (requestLoading) requestLoading(false)
    } catch (e) {
      setLoading(false)
      if (requestLoading) requestLoading(false)
    }
  }

  const refresh = () => {
    fetchList(pagination, true)
  }

  useEffect(() => {
    if (!isEmpty(searchParams)) {
      fetchList()
    }
  }, [searchParams])

  useEffect(() => {
    if (getSelectCheckbox) getSelectCheckbox(selectCheckbox)
  }, [selectCheckbox, list])

  const handlePaginationChange = async (pagination: TablePagination) => {
    await fetchList(pagination)
    setPagination(pagination)
  }

  const tablePagination = {
    ...pagination,
    count,
  }

  const getSelectedValue = () => ({
    selectCheckbox,
  })

  const getList = () => list

  const getCacheList = () => cacheAllList

  useImperativeHandle(ref, () => ({
    getSelectedValue,
    setList,
    setCacheAllList,
    getList,
    getCacheList,
    refresh,
  }))

  const getCurrentAllItemsSelect = () => {
    if (!selectCheckbox.length) return false
    return list.every((item: CustomFieldItems) => {
      const option = item?.node || item

      return selectCheckbox.includes(option[selectedSymbol])
    })
  }

  useEffect(() => {
    if (isSelectOtherPageCheckbox) {
      const flag = getCurrentAllItemsSelect()
      setAllSelect(flag)
    }
  }, [selectCheckbox, pagination])

  const handleSelectAllItems = () => {
    const singlePageCheckbox = () => {
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

    const otherPageCheckbox = () => {
      const flag = getCurrentAllItemsSelect()

      const newSelectCheckbox = [...selectCheckbox]
      if (flag) {
        list.forEach((item: CustomFieldItems) => {
          const option = item?.node || item
          const index = newSelectCheckbox.findIndex(
            (item: any) => item === option[selectedSymbol]
          )
          newSelectCheckbox.splice(index, 1)
        })
      } else {
        list.forEach((item: CustomFieldItems) => {
          const option = item?.node || item
          if (!selectCheckbox.includes(option[selectedSymbol])) {
            newSelectCheckbox.push(option[selectedSymbol])
          }
        })
      }

      setSelectCheckbox(newSelectCheckbox)
    }

    if (isSelectOtherPageCheckbox) {
      otherPageCheckbox()
    } else {
      singlePageCheckbox()
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
      showCheckbox={showCheckbox}
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
    />
  )
}

const B3PaginationTable = memo(forwardRef(PaginationTable))

export { B3PaginationTable }
