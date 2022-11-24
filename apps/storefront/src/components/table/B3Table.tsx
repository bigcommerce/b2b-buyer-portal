import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TablePagination from '@mui/material/TablePagination'
import Stack from '@mui/material/Stack'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import {
  ReactNode,
  ChangeEvent,
  MouseEvent,
  ReactElement,
} from 'react'

import {
  B3InfiniteScroll,
} from './B3InfiniteScroll'

import {
  B3NoData,
} from './B3NoData'

export interface Pagination {
  offset: number,
  first: number,
  count: number,
}

export interface TableColumnItem<T> {
  key: string,
  title: string,
  width?: string,
  render?: (item: T, index: number) => ReactNode,
}

interface TableProps<T> {
  tableFixed?: boolean,
  tableHeaderHide?: boolean,
  columnItems: TableColumnItem<T>[],
  listItems: Array<any>,
  itemSpacing?: number,
  itemXs?: number,
  onPaginationChange?: (pagination: Pagination)=>void,
  pagination?: Pagination,
  rowsPerPageOptions?: number[],
  showPagination?: boolean,
  renderItem?: (row: T, index: number) => ReactElement,
  isCustomRender?: boolean,
  isInfiniteScroll?: boolean,
  isLoading?: boolean,
  infiniteScrollThreshold?: number,
  infiniteScrollNode?: HTMLElement,
  infiniteScrollLoader?: ReactElement,
  infiniteScrollHeight?: string,
  noDataText?: string,
  tableKey?: string,
}

export const B3Table:<T>(props: TableProps<T>) => ReactElement = ({
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
  renderItem = () => {},
  isCustomRender = false,
  isInfiniteScroll = false,
  isLoading = false,
  infiniteScrollThreshold,
  infiniteScrollNode,
  infiniteScrollLoader,
  itemSpacing = 2,
  itemXs = 4,
  noDataText,
  tableHeaderHide = false,
  tableKey,
}) => {
  const {
    offset,
    count,
    first,
  } = pagination

  const handlePaginationChange = (pagination: Pagination) => {
    if (!isLoading) {
      onPaginationChange(pagination)
    }
  }

  const handleChangePage = (event: MouseEvent<HTMLButtonElement> | null, page: number) => {
    handlePaginationChange({
      ...pagination,
      offset: (page * first),
    })
  }

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    handlePaginationChange({
      ...pagination,
      offset: 0,
      first: parseInt(event.target.value, 10) || first,
    })
  }

  return listItems.length > 0 ? (
    <>
      {
        isInfiniteScroll && (
          <B3InfiniteScroll
            pagination={pagination}
            allCount={listItems.length}
            onPaginationChange={handlePaginationChange}
            isLoading={isLoading}
            threshold={infiniteScrollThreshold}
            scrollNode={infiniteScrollNode}
            loader={infiniteScrollLoader}
          >
            <Stack spacing={itemSpacing}>
              {
                listItems.map((row, index) => (
                  <>
                    {
                      renderItem(row.node, index)
                    }
                  </>
                ))
          }
            </Stack>
          </B3InfiniteScroll>
        )
      }
      {
        !isInfiniteScroll && isCustomRender && (
          <>
            <Grid
              container
              spacing={itemSpacing}
            >
              {
                listItems.map((row, index) => {
                  const node = row.node || row || {}
                  return (
                    <Grid
                      item
                      xs={itemXs}
                      key={node[tableKey || 'id']}
                    >
                      <>
                        {row?.node && renderItem(row.node, index)}
                      </>
                    </Grid>
                  )
                })
              }
            </Grid>
            {
              showPagination && (
                <TablePagination
                  rowsPerPageOptions={rowsPerPageOptions}
                  component="div"
                  count={count}
                  rowsPerPage={first}
                  page={first === 0 ? 0 : offset / first}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              )
            }
          </>
        )
      }
      { !isInfiniteScroll && !isCustomRender && (
        <Card
          sx={{
            height: '100%',
          }}
        >
          <TableContainer>
            <Table
              sx={{
                tableLayout: tableFixed ? 'fixed' : 'initial',
              }}
            >
              {
                !tableHeaderHide && (
                <TableHead>
                  <TableRow>
                    {
                      columnItems.map((column) => (
                        <TableCell
                          key={column.title}
                          width={column.width}
                        >
                          {column.title}
                        </TableCell>
                      ))
                    }
                  </TableRow>
                </TableHead>
                )
              }

              <TableBody>
                {listItems.map((row, index) => {
                  const node = row.node || row || {}
                  return (
                    <TableRow key={node[tableKey || 'id']}>
                      {
                        columnItems.map((column) => (
                          <TableCell key={column.title}>
                            {column.render ? column.render(node, index) : node[column.key]}
                          </TableCell>
                        ))
                      }
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
          {
            showPagination && (
              <TablePagination
                rowsPerPageOptions={rowsPerPageOptions}
                component="div"
                count={count}
                rowsPerPage={first}
                page={first === 0 ? 0 : offset / first}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            )
          }
        </Card>
      )}
    </>
  ) : <B3NoData text={noDataText} />
}
