import { ChangeEvent, FC, MouseEvent, ReactElement, ReactNode, useContext, useState } from 'react';
import { useB3Lang } from '@b3/lang';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import {
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
} from '@mui/material';
import IconButton from '@mui/material/IconButton';
import TableSortLabel from '@mui/material/TableSortLabel';

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
  isCollapse?: boolean;
  disableCurrentCheckbox?: boolean;
};

export interface Pagination {
  offset: number;
  first: number;
  count: number;
}

export interface TableColumnItem<Row> {
  key: string;
  title: string;
  width?: string;
  render?: (row: Row, index: number) => ReactNode;
  style?: { [key: string]: string };
  isSortable?: boolean;
}

interface RowProps<Row> {
  CollapseComponent?: FC<{ row: Row }>;
  columnItems: TableColumnItem<Row>[];
  node: WithRowControls<Row>;
  index: number;
  showBorder?: boolean;
  showCheckbox?: boolean;
  selectedSymbol?: string;
  selectCheckbox?: Array<number | string>;
  disableCheckbox?: boolean;
  applyAllDisableCheckbox?: boolean;
  handleSelectOneItem?: (id: number | string) => void;
  tableKey?: string;
  onClickRow?: (row: Row, index?: number) => void;
  hover?: boolean;
  clickableRowStyles?: { [key: string]: string };
  lastItemBorderBottom: string;
}

const MOUSE_POINTER_STYLE = {
  cursor: 'pointer',
};

function Row<Row>({
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
}: RowProps<Row>) {
  const { isCollapse = false, disableCurrentCheckbox } = node;

  const [open, setOpen] = useState<boolean>(isCollapse || false);

  return (
    <>
      <TableRow
        // @ts-expect-error typed previously as an any
        key={`${node[tableKey || 'id'] + index}`}
        hover={hover}
        onClick={() => onClickRow?.(node, index)}
        sx={clickableRowStyles}
        data-testid="tableBody-Row"
      >
        {showCheckbox && selectedSymbol && (
          <TableCell
            key={`showItemCheckbox-${node.id}`}
            sx={{
              borderBottom: showBorder ? '1px solid rgba(224, 224, 224, 1)' : lastItemBorderBottom,
            }}
          >
            <Checkbox
              // @ts-expect-error typed previously as an any
              checked={selectCheckbox.includes(node[selectedSymbol])}
              onChange={() => {
                // @ts-expect-error typed previously as an any
                if (handleSelectOneItem) handleSelectOneItem(node[selectedSymbol]);
              }}
              disabled={applyAllDisableCheckbox ? disableCheckbox : disableCurrentCheckbox}
            />
          </TableCell>
        )}

        {CollapseComponent && (
          <TableCell>
            <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
              {open ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
            </IconButton>
          </TableCell>
        )}

        {columnItems.map((column) => (
          <TableCell
            key={column.title}
            sx={{
              ...column?.style,
              borderBottom: showBorder ? '1px solid rgba(224, 224, 224, 1)' : lastItemBorderBottom,
            }}
            data-testid={column?.key ? `tableBody-${column?.key}` : ''}
          >
            {/* @ts-expect-error typed previously as an any */}
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
  );
}

interface TableProps<Row> {
  columnItems: TableColumnItem<Row>[];
  listItems: PossibleNodeWrapper<WithRowControls<Row>>[];
  onPaginationChange?: (pagination: Pagination) => void;
  pagination?: Pagination;
  renderItem?: (
    row: Row,
    index?: number,
    checkBox?: (disable?: boolean) => ReactElement,
  ) => ReactElement;
  isInfiniteScroll?: boolean;
  isLoading?: boolean;
  setNeedUpdate?: (boolean: boolean) => void;
  handleSelectOneItem?: (id: number | string) => void;
  selectCheckbox?: Array<number | string>;
  onClickRow?: (row: Row, index?: number) => void;
  sortDirection?: 'asc' | 'desc';
  sortByFn?: (e: { key: string }) => void;
  orderBy?: string;
}

export function B3Table<Row>({
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
  isLoading = false,
  setNeedUpdate = () => {},
  handleSelectOneItem,
  selectCheckbox = [],
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
  const clickableRowStyles = typeof onClickRow === 'function' ? MOUSE_POINTER_STYLE : undefined;

  const handlePaginationChange = (pagination: Pagination) => {
    if (!isLoading) {
      onPaginationChange(pagination);
    }
  };

  const handleChangePage = (_: MouseEvent<HTMLButtonElement> | null, page: number) => {
    handlePaginationChange({
      ...pagination,
      offset: page * first,
    });

    setNeedUpdate(true);
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
              const node = isNodeWrapper(row) ? row.node : row;

              const checkBox = (disable = false) => (
                <Checkbox
                  // @ts-expect-error typed previously as an any
                  checked={selectCheckbox.includes(node.id)}
                  onChange={() => {
                    // @ts-expect-error typed previously as an any
                    if (handleSelectOneItem) handleSelectOneItem(node.id);
                  }}
                  disabled={disable || false}
                />
              );
              return (
                // @ts-expect-error typed previously as an any
                <Grid item xs={12} key={`${node['orderId' || 'id'] + index}`}>
                  {node && renderItem && renderItem(node, index, checkBox)}
                </Grid>
              );
            })}
          </Grid>
          <TablePagination
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
                      sx={
                        column?.style
                          ? {
                              ...column.style,
                            }
                          : {}
                      }
                      sortDirection={column.key === orderBy ? sortDirection : false}
                      data-testid={column?.key ? `tableHead-${column?.key}` : ''}
                    >
                      {column?.isSortable ? (
                        <TableSortLabel
                          active={column.key === orderBy}
                          direction={column.key === orderBy ? sortDirection : 'desc'}
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

              <TableBody>
                {listItems.map((row, index) => {
                  const node = isNodeWrapper(row) ? row.node : row;

                  const lastItemBorderBottom =
                    index === listItems.length - 1 ? '1px solid rgba(224, 224, 224, 1)' : 'none';
                  return (
                    <Row
                      // @ts-expect-error typed previously as an any
                      key={`row-${node['orderId' || 'id'] + index}`}
                      columnItems={columnItems}
                      node={node}
                      index={index}
                      showCheckbox={false}
                      selectCheckbox={selectCheckbox}
                      selectedSymbol="id"
                      disableCheckbox={false}
                      applyAllDisableCheckbox
                      showBorder
                      handleSelectOneItem={handleSelectOneItem}
                      clickableRowStyles={clickableRowStyles}
                      lastItemBorderBottom={lastItemBorderBottom}
                      hover
                      tableKey="orderId"
                      onClickRow={onClickRow}
                      CollapseComponent={undefined}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
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
    <B3NoData isLoading={isLoading} text="" />
  );
}
