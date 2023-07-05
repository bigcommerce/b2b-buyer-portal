import {
  ChangeEvent,
  MouseEvent,
  ReactElement,
  ReactNode,
  useContext,
  useState,
} from 'react'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import {
  Box,
  Card,
  Checkbox,
  Collapse,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from '@mui/material'
import IconButton from '@mui/material/IconButton'
import TableSortLabel from '@mui/material/TableSortLabel'

import { useMobile } from '@/hooks'
import { CustomStyleContext } from '@/shared/customStyleButtton'

import {
  b3HexToRgb,
  getContrastColor,
} from '../outSideComponents/utils/b3CustomStyles'

import B3NoData from './B3NoData'

export interface Pagination {
  offset: number
  first: number
  count: number
}

export interface TableColumnItem<T> {
  key: string
  title: string
  width?: string
  render?: (item: T, index: number) => ReactNode
  style?: { [key: string]: string }
  isSortable?: boolean
}

interface TableProps<T> {
  tableFixed?: boolean
  tableHeaderHide?: boolean
  columnItems: TableColumnItem<T>[]
  listItems: Array<any>
  itemSpacing?: number
  itemIsMobileSpacing?: number
  itemXs?: number
  onPaginationChange?: (pagination: Pagination) => void
  pagination?: Pagination
  rowsPerPageOptions?: number[]
  showPagination?: boolean
  renderItem?: (
    row: T,
    index?: number,
    checkBox?: () => ReactElement
  ) => ReactElement
  CollapseComponent?: (row: T) => ReactElement
  isCustomRender?: boolean
  isInfiniteScroll?: boolean
  isLoading?: boolean
  noDataText?: string
  tableKey?: string
  showCheckbox?: boolean
  showSelectAllCheckbox?: boolean
  setNeedUpdate?: (boolean: boolean) => void
  handleSelectAllItems?: () => void
  handleSelectOneItem?: (id: number | string) => void
  hover?: boolean
  showBorder?: boolean
  selectedSymbol?: string
  selectCheckbox?: Array<number | string>
  labelRowsPerPage?: string
  disableCheckbox?: boolean
  applyAllDisableCheckbox?: boolean
  onClickRow?: (item: any, index?: number) => void
  showRowsPerPageOptions?: boolean
  isSelectOtherPageCheckbox?: boolean
  isAllSelect?: boolean
  sortDirection?: 'asc' | 'desc'
  sortByFn?: (node: any) => void
  orderBy: string
}

interface RowProps<T> {
  CollapseComponent?: (row: T) => ReactElement
  columnItems: TableColumnItem<T>[]
  node: T
  index: number
  showBorder?: boolean
  showCheckbox?: boolean
  selectedSymbol?: string
  selectCheckbox?: Array<number | string>
  disableCheckbox?: boolean
  applyAllDisableCheckbox?: boolean
  handleSelectOneItem?: (id: number | string) => void
  tableKey?: string
  onClickRow?: (item: any, index?: number) => void
  hover?: boolean
  clickableRowStyles?: { [key: string]: string }
  lastItemBorderBottom: string
}

const MOUSE_POINTER_STYLE = {
  cursor: 'pointer',
}

function Row({
  columnItems,
  node,
  index,
  showCheckbox,
  selectCheckbox = [],
  selectedSymbol,
  disableCheckbox,
  showBorder,
  handleSelectOneItem,
  clickableRowStyles,
  lastItemBorderBottom,
  tableKey,
  onClickRow,
  hover,
  CollapseComponent,
  applyAllDisableCheckbox,
}: RowProps<any>) {
  const { isCollapse = false, disableCurrentCheckbox } = node

  const [open, setOpen] = useState<boolean>(isCollapse || false)

  return (
    <>
      <TableRow
        key={`${node[tableKey || 'id'] + index}`}
        hover={hover}
        onClick={() => onClickRow?.(node, index)}
        sx={clickableRowStyles}
      >
        {showCheckbox && selectedSymbol && (
          <TableCell
            key={`showItemCheckbox-${node.id}`}
            sx={{
              borderBottom: showBorder
                ? '1px solid rgba(224, 224, 224, 1)'
                : lastItemBorderBottom,
            }}
          >
            <Checkbox
              checked={selectCheckbox.includes(node[selectedSymbol])}
              onChange={() => {
                if (handleSelectOneItem)
                  handleSelectOneItem(node[selectedSymbol])
              }}
              disabled={
                applyAllDisableCheckbox
                  ? disableCheckbox
                  : disableCurrentCheckbox
              }
            />
          </TableCell>
        )}

        {CollapseComponent && (
          <TableCell>
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
            </IconButton>
          </TableCell>
        )}

        {columnItems.map((column) => (
          <TableCell
            key={column.title}
            sx={{
              ...column?.style,
              borderBottom: showBorder
                ? '1px solid rgba(224, 224, 224, 1)'
                : lastItemBorderBottom,
            }}
          >
            {column.render ? column.render(node, index) : node[column.key]}
          </TableCell>
        ))}
      </TableRow>
      {CollapseComponent && (
        <TableRow>
          <TableCell style={{ padding: 0 }} colSpan={24}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <CollapseComponent row={node} />
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

export function B3Table<T>({
  tableFixed = true,
  columnItems,
  listItems = [],
  pagination = {
    offset: 0,
    count: 0,
    first: 10,
  },
  onPaginationChange = () => {},
  rowsPerPageOptions = [10, 20, 50],
  showPagination = true,
  renderItem,
  isCustomRender = false,
  isInfiniteScroll = false,
  isLoading = false,
  itemSpacing = 2,
  itemIsMobileSpacing = 2,
  itemXs = 4,
  noDataText,
  tableHeaderHide = false,
  tableKey,
  showCheckbox = false,
  showSelectAllCheckbox = false,
  setNeedUpdate = () => {},
  handleSelectAllItems,
  handleSelectOneItem,
  hover = false,
  showBorder = true,
  selectedSymbol = 'id',
  isSelectOtherPageCheckbox = false,
  isAllSelect = false,
  selectCheckbox = [],
  labelRowsPerPage = '',
  disableCheckbox = false,
  onClickRow,
  showRowsPerPageOptions = true,
  CollapseComponent,
  applyAllDisableCheckbox = true,
  sortDirection = 'asc',
  sortByFn,
  orderBy = '',
}: TableProps<T>) {
  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext)

  const customColor = getContrastColor(backgroundColor)

  const [isMobile] = useMobile()

  const { offset, count, first } = pagination
  const clickableRowStyles =
    typeof onClickRow === 'function' ? MOUSE_POINTER_STYLE : undefined

  const handlePaginationChange = (pagination: Pagination) => {
    if (!isLoading) {
      onPaginationChange(pagination)
    }
  }

  const handleChangePage = (
    event: MouseEvent<HTMLButtonElement> | null,
    page: number
  ) => {
    handlePaginationChange({
      ...pagination,
      offset: page * first,
    })

    setNeedUpdate(true)
  }

  const handleChangeRowsPerPage = (
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    handlePaginationChange({
      ...pagination,
      offset: 0,
      first: parseInt(event.target.value, 10) || first,
    })
  }

  return listItems.length > 0 ? (
    <>
      {isInfiniteScroll && (
        <>
          {showSelectAllCheckbox && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Checkbox
                checked={
                  isSelectOtherPageCheckbox
                    ? isAllSelect
                    : selectCheckbox.length === listItems.length
                }
                onChange={handleSelectAllItems}
                disabled={disableCheckbox}
              />
              Select all
            </Box>
          )}
          <Grid container spacing={itemIsMobileSpacing}>
            {listItems.map((row, index) => {
              const node = row.node || row || {}
              const checkBox = () => (
                <Checkbox
                  checked={selectCheckbox.includes(node[selectedSymbol])}
                  onChange={() => {
                    if (handleSelectOneItem)
                      handleSelectOneItem(node[selectedSymbol])
                  }}
                  disabled={disableCheckbox}
                />
              )
              return (
                <Grid item xs={12} key={`${node[tableKey || 'id'] + index}`}>
                  {node && renderItem && renderItem(node, index, checkBox)}
                </Grid>
              )
            })}
          </Grid>

          {showPagination && (
            <TablePagination
              rowsPerPageOptions={
                showRowsPerPageOptions ? rowsPerPageOptions : []
              }
              labelRowsPerPage={labelRowsPerPage || 'per page:'}
              component="div"
              sx={{
                color: isMobile
                  ? b3HexToRgb(customColor, 0.87)
                  : 'rgba(0, 0, 0, 0.87)',
                marginTop: '1.5rem',
                '::-webkit-scrollbar': {
                  display: 'none',
                },
                '& svg': {
                  color: isMobile
                    ? b3HexToRgb(customColor, 0.87)
                    : 'rgba(0, 0, 0, 0.87)',
                },
              }}
              count={count}
              rowsPerPage={first}
              page={first === 0 ? 0 : offset / first}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          )}
        </>
      )}
      {!isInfiniteScroll && isCustomRender && (
        <>
          <Grid container spacing={itemSpacing}>
            {listItems.map((row, index) => {
              const node = row.node || row || {}
              return (
                <Grid
                  item
                  xs={itemXs}
                  key={`${node[tableKey || 'id'] + index}`}
                >
                  {node && renderItem && renderItem(node, index)}
                </Grid>
              )
            })}
          </Grid>
          {showPagination && (
            <TablePagination
              rowsPerPageOptions={
                showRowsPerPageOptions ? rowsPerPageOptions : []
              }
              labelRowsPerPage={labelRowsPerPage || 'Cards per page:'}
              component="div"
              sx={{
                color: customColor,
                marginTop: '1.5rem',
                '::-webkit-scrollbar': {
                  display: 'none',
                },
                '& svg': {
                  color: customColor,
                },
              }}
              count={count}
              rowsPerPage={first}
              page={first === 0 ? 0 : offset / first}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          )}
        </>
      )}
      {!isInfiniteScroll && !isCustomRender && (
        <Card
          sx={{
            height: '100%',
            boxShadow: showBorder
              ? '0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)'
              : 'none',
          }}
        >
          <TableContainer>
            <Table
              sx={{
                tableLayout: tableFixed ? 'fixed' : 'initial',
              }}
            >
              {!tableHeaderHide && (
                <TableHead>
                  <TableRow>
                    {showSelectAllCheckbox && (
                      <TableCell key="showSelectAllCheckbox">
                        <Checkbox
                          checked={
                            isSelectOtherPageCheckbox
                              ? isAllSelect
                              : selectCheckbox.length === listItems.length
                          }
                          onChange={handleSelectAllItems}
                          disabled={disableCheckbox}
                        />
                      </TableCell>
                    )}
                    {CollapseComponent && <TableCell width="2%" />}

                    {columnItems.map((column) => (
                      <TableCell
                        key={column.title}
                        width={column.width}
                        sx={
                          column?.style
                            ? {
                                ...column.style,
                              }
                            : {}
                        }
                        sortDirection={
                          column.key === orderBy ? sortDirection : false
                        }
                      >
                        {column?.isSortable ? (
                          <TableSortLabel
                            active={column.key === orderBy}
                            direction={
                              column.key === orderBy ? sortDirection : 'desc'
                            }
                            hideSortIcon={column.key !== orderBy}
                            onClick={() => sortByFn && sortByFn(column)}
                          >
                            {column.title}
                          </TableSortLabel>
                        ) : (
                          column.title
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
              )}

              <TableBody>
                {listItems.map((row, index) => {
                  const node = row.node || row || {}

                  const lastItemBorderBottom =
                    index === listItems.length - 1
                      ? '1px solid rgba(224, 224, 224, 1)'
                      : 'none'
                  return (
                    <Row
                      columnItems={columnItems}
                      node={node}
                      index={index}
                      showCheckbox={showCheckbox}
                      selectCheckbox={selectCheckbox}
                      selectedSymbol={selectedSymbol}
                      disableCheckbox={disableCheckbox}
                      applyAllDisableCheckbox={applyAllDisableCheckbox}
                      showBorder={showBorder}
                      handleSelectOneItem={handleSelectOneItem}
                      clickableRowStyles={clickableRowStyles}
                      lastItemBorderBottom={lastItemBorderBottom}
                      hover={hover}
                      tableKey={tableKey}
                      onClickRow={onClickRow}
                      CollapseComponent={CollapseComponent}
                    />
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
          {showPagination && (
            <TablePagination
              rowsPerPageOptions={
                showRowsPerPageOptions ? rowsPerPageOptions : []
              }
              labelRowsPerPage={labelRowsPerPage || 'Rows per page:'}
              component="div"
              sx={{
                marginTop: '1.5rem',
                '::-webkit-scrollbar': {
                  display: 'none',
                },
              }}
              count={count}
              rowsPerPage={first}
              page={first === 0 ? 0 : offset / first}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          )}
        </Card>
      )}
    </>
  ) : (
    <B3NoData isLoading={isLoading} text={noDataText} />
  )
}
