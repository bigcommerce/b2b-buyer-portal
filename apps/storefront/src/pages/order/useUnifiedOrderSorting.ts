import { useMemo, useState } from 'react';

import { OrdersSortInput } from '@/shared/service/bc/graphql/orders';

type SortDir = 'asc' | 'desc';

export type SortMap<K extends string> = Record<K, Record<SortDir, OrdersSortInput>>;

export interface UseUnifiedOrderSortingResult<K extends string> {
  activeSort: { key: K; dir: SortDir };
  sortBy: OrdersSortInput;
  handleSetOrderBy: (key: string) => void;
}

export type BaseSortableColumnKey = 'orderId' | 'poNumber' | 'totalIncTax' | 'status' | 'createdAt';

export const BASE_SORT_MAP: SortMap<BaseSortableColumnKey> = {
  orderId: { asc: OrdersSortInput.ID_A_TO_Z, desc: OrdersSortInput.ID_Z_TO_A },
  poNumber: { asc: OrdersSortInput.REFERENCE_A_TO_Z, desc: OrdersSortInput.REFERENCE_Z_TO_A },
  totalIncTax: {
    asc: OrdersSortInput.LOWEST_TOTAL_INC_TAX,
    desc: OrdersSortInput.HIGHEST_TOTAL_INC_TAX,
  },
  status: { asc: OrdersSortInput.STATUS_A_TO_Z, desc: OrdersSortInput.STATUS_Z_TO_A },
  createdAt: { asc: OrdersSortInput.CREATED_AT_OLDEST, desc: OrdersSortInput.CREATED_AT_NEWEST },
};

export const useUnifiedOrderSorting = <K extends string>(
  columnKeyToSortInput: SortMap<K>,
  resetPagination: () => void,
  defaultSortKey: K,
): UseUnifiedOrderSortingResult<K> => {
  const sortableKeys = useMemo(
    () => new Set(Object.keys(columnKeyToSortInput) as K[]),
    [columnKeyToSortInput],
  );

  const [activeSort, setActiveSort] = useState<{ key: K; dir: SortDir }>({
    key: defaultSortKey,
    dir: 'desc',
  });

  const sortBy = useMemo(
    () => columnKeyToSortInput[activeSort.key][activeSort.dir],
    [columnKeyToSortInput, activeSort],
  );

  const handleSetOrderBy = (key: string) => {
    if (!sortableKeys.has(key as K)) return;
    const typedKey = key as K;
    resetPagination();
    setActiveSort((prev) =>
      prev.key === typedKey
        ? { key: typedKey, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key: typedKey, dir: 'desc' },
    );
  };

  return { activeSort, sortBy, handleSetOrderBy };
};
