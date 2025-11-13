import { ChangeEvent, MouseEvent, ReactElement, ReactNode, useContext } from 'react';
import {
  Card,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from '@mui/material';
import TableSortLabel from '@mui/material/TableSortLabel';

import { b3HexToRgb, getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import { CustomStyleContext } from '@/shared/customStyleButton';

import B3NoData from './B3NoData';

interface NodeWrapper<T extends object> {
  node: T;
}

export type PossibleNodeWrapper<T extends object> = T | NodeWrapper<T>;

const isNodeWrapper = <T extends object>(item: PossibleNodeWrapper<T>): item is NodeWrapper<T> =>
  'node' in item;

type WithRowControls<T> = T & {
  id?: string | number;
};

interface Pagination {
  offset: number;
  first: number;
  count: number;
}

interface OrderIdRow {
  orderId: string;
}

export interface TableColumnItem<Row extends OrderIdRow> {
  key: string;
  title: string;
  align?: 'right';
  width?: string;
  render: (row: Row) => ReactNode;
  isSortable?: boolean;
}

interface RowProps<Row extends OrderIdRow> {
  columnItems: TableColumnItem<Row>[];
  node: WithRowControls<Row>;
  onClickRow: () => void;
}

function Row<Row extends OrderIdRow>({ columnItems, node, onClickRow }: RowProps<Row>) {
  return (
    <TableRow
      hover
      onClick={onClickRow}
      sx={{
        cursor: 'pointer',
      }}
      data-testid="tableBody-Row"
    >
      {columnItems.map((column) => (
        <TableCell
          align={column.align ?? 'left'}
          key={column.title}
          data-testid={column.key ? `tableBody-${column.key}` : ''}
        >
          {column.render(node)}
        </TableCell>
      ))}
    </TableRow>
  );
}

interface TableProps<Row extends OrderIdRow> {
  columnItems: TableColumnItem<Row>[];
  listItems: WithRowControls<Row>[];
  onPaginationChange?: (pagination: Pagination) => void;
  pagination?: Pagination;
  renderItem: (row: Row, index: number) => ReactElement;
  isInfiniteScroll?: boolean;
  onClickRow: (row: Row, index: number) => void;
  sortDirection?: 'asc' | 'desc';
  sortByFn?: (key: string) => void;
  orderBy?: string;
}

export function B3Table<Row extends OrderIdRow>({
  columnItems,
  listItems = [],
  pagination = {
    offset: 0,
    count: 0,
    first: 10,
  },
  onPaginationChange = () => {},
  renderItem,
  isInfiniteScroll = false,
  onClickRow,
  sortDirection = 'asc',
  sortByFn,
  orderBy = '',
}: TableProps<Row>) {
  const rowsPerPageOptions = [10, 20, 30];

  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext);

  const customColor = getContrastColor(backgroundColor);

  const [isMobile] = useMobile();

  const b3Lang = useB3Lang();

  const { offset, count, first } = pagination;

  const handlePaginationChange = (pagination: Pagination) => {
    onPaginationChange(pagination);
  };

  const handleChangePage = (_: MouseEvent<HTMLButtonElement> | null, page: number) => {
    handlePaginationChange({
      ...pagination,
      offset: page * first,
    });
  };

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    handlePaginationChange({
      ...pagination,
      offset: 0,
      first: parseInt(event.target.value, 10) || first,
    });
  };

  return listItems.length > 0 ? (
    <>
      {isInfiniteScroll && (
        <>
          <Grid container spacing={2}>
            {listItems.map((row, index) => {
              return (
                <Grid item xs={12} key={row.orderId}>
                  {renderItem(row, index)}
                </Grid>
              );
            })}
          </Grid>
          <TablePagination
            labelDisplayedRows={({ from, to, count }) =>
              b3Lang('global.pagination.pageXOfY', { from, to, count })
            }
            rowsPerPageOptions={rowsPerPageOptions}
            labelRowsPerPage={b3Lang('global.pagination.perPage')}
            component="div"
            sx={{
              color: isMobile ? b3HexToRgb(customColor, 0.87) : 'rgba(0, 0, 0, 0.87)',
              marginTop: '1.5rem',
              '::-webkit-scrollbar': {
                display: 'none',
              },
              '& svg': {
                color: isMobile ? b3HexToRgb(customColor, 0.87) : 'rgba(0, 0, 0, 0.87)',
              },
            }}
            count={count}
            rowsPerPage={first}
            page={first === 0 ? 0 : offset / first}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}
      {!isInfiniteScroll && (
        <Card
          sx={{
            height: '100%',
            boxShadow:
              '0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
          }}
        >
          <TableContainer>
            <Table
              sx={{
                tableLayout: 'initial',
              }}
            >
              <TableHead>
                <TableRow data-testid="tableHead-Row">
                  {columnItems.map((column) => (
                    <TableCell
                      key={column.title}
                      width={column.width}
                      align={column.align ?? 'left'}
                      sortDirection={column.key === orderBy ? sortDirection : false}
                      data-testid={column.key ? `tableHead-${column.key}` : ''}
                    >
                      {column.isSortable ? (
                        <TableSortLabel
                          active={column.key === orderBy}
                          direction={column.key === orderBy ? sortDirection : 'desc'}
                          hideSortIcon={column.key !== orderBy}
                          onClick={() => sortByFn?.(column.key)}
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

              <TableBody>
                {listItems.map((row, index) => {
                  const node = isNodeWrapper(row) ? row.node : row;

                  return (
                    <Row
                      key={`row-${node.orderId}`}
                      columnItems={columnItems}
                      node={node}
                      onClickRow={() => onClickRow(node, index)}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            labelDisplayedRows={({ from, to, count }) =>
              b3Lang('global.pagination.pageXOfY', { from, to, count })
            }
            rowsPerPageOptions={rowsPerPageOptions}
            labelRowsPerPage={b3Lang('global.pagination.rowsPerPage')}
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
        </Card>
      )}
    </>
  ) : (
    <B3NoData />
  );
}
