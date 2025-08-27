import { ChangeEvent, MouseEvent, ReactElement, useContext } from 'react';
import { Grid, TablePagination } from '@mui/material';

import { b3HexToRgb, getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles';
import { useMobile } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
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

interface TableProps<Row> {
  listItems: PossibleNodeWrapper<WithRowControls<Row>>[];
  itemXs: number;
  onPaginationChange: (pagination: Pagination) => void;
  pagination: Pagination;
  rowsPerPageOptions: number[];
  renderItem: (row: Row) => ReactElement;
  isInfiniteScroll: boolean;
  isLoading: boolean;
  showRowsPerPageOptions: boolean;
}

export function B3Table<Row>({
  listItems,
  pagination,
  onPaginationChange,
  rowsPerPageOptions,
  renderItem,
  isInfiniteScroll,
  isLoading,
  itemXs,
  showRowsPerPageOptions,
}: TableProps<Row>) {
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
    if (!isLoading) {
      onPaginationChange(pagination);
    }
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
              const node = isNodeWrapper(row) ? row.node : row;

              return (
                // @ts-expect-error typed previously as an any
                <Grid item xs={12} key={`${node.id + index}`}>
                  {node && renderItem(node)}
                </Grid>
              );
            })}
          </Grid>

          <TablePagination
            rowsPerPageOptions={showRowsPerPageOptions ? rowsPerPageOptions : []}
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
        <>
          <Grid container spacing={2}>
            {listItems.map((row, index) => {
              const node = isNodeWrapper(row) ? row.node : row;

              return (
                // @ts-expect-error typed previously as an any
                <Grid item xs={itemXs} key={`${node.id + index}`}>
                  {node && renderItem && renderItem(node)}
                </Grid>
              );
            })}
          </Grid>

          <TablePagination
            rowsPerPageOptions={showRowsPerPageOptions ? rowsPerPageOptions : []}
            labelRowsPerPage={b3Lang('global.pagination.cardsPerPage')}
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
        </>
      )}
    </>
  ) : (
    <B3NoData isLoading={isLoading} />
  );
}
