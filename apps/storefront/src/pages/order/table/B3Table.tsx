import { useB3Lang } from '@b3/lang';
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
import { ChangeEvent, MouseEvent, ReactElement, ReactNode, useContext } from 'react';

import { b3HexToRgb, getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles';
import { useMobile } from '@/hooks';
import { CustomStyleContext } from '@/shared/customStyleButton';

import B3NoData from './B3NoData';

interface NodeWrapper<T extends object> {
  node: T;
}

export type PossibleNodeWrapper<T extends object> = T | NodeWrapper<T>;

export const isNodeWrapper = <T extends object>(
  item: PossibleNodeWrapper<T>,
): item is NodeWrapper<T> => 'node' in item;

export type WithRowControls<T> = T & {
  id?: string | number;
};

export interface Pagination {
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
      data-testid="tableBody-Row"
      hover
      onClick={onClickRow}
      sx={{
        cursor: 'pointer',
      }}
    >
      {columnItems.map((column) => (
        <TableCell
          align={column.align ?? 'left'}
          data-testid={column.key ? `tableBody-${column.key}` : ''}
          key={column.title}
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
                <Grid item key={row.orderId} xs={12}>
                  {renderItem(row, index)}
                </Grid>
              );
            })}
          </Grid>
          <TablePagination
            component="div"
            count={count}
            labelRowsPerPage={b3Lang('global.pagination.perPage')}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            page={first === 0 ? 0 : offset / first}
            rowsPerPage={first}
            rowsPerPageOptions={rowsPerPageOptions}
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
                      align={column.align ?? 'left'}
                      data-testid={column.key ? `tableHead-${column.key}` : ''}
                      key={column.title}
                      sortDirection={column.key === orderBy ? sortDirection : false}
                      width={column.width}
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
                      columnItems={columnItems}
                      key={`row-${node.orderId}`}
                      node={node}
                      onClickRow={() => onClickRow(node, index)}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={count}
            labelRowsPerPage={b3Lang('global.pagination.rowsPerPage')}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            page={first === 0 ? 0 : offset / first}
            rowsPerPage={first}
            rowsPerPageOptions={rowsPerPageOptions}
            sx={{
              marginTop: '1.5rem',
              '::-webkit-scrollbar': {
                display: 'none',
              },
            }}
          />
        </Card>
      )}
    </>
  ) : (
    <B3NoData />
  );
}
