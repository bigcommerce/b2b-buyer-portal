import { OrdersSortInput } from '@/shared/service/bc/graphql/orders';

import {
  BASE_SORT_MAP,
  BaseSortableColumnKey,
  SortMap,
  useUnifiedOrderSorting,
  UseUnifiedOrderSortingResult,
} from './useUnifiedOrderSorting';

export type CompanySortableColumnKey = BaseSortableColumnKey | 'placedBy';

const COMPANY_SORT_MAP: SortMap<CompanySortableColumnKey> = {
  ...BASE_SORT_MAP,
  placedBy: { asc: OrdersSortInput.PLACED_BY_A_TO_Z, desc: OrdersSortInput.PLACED_BY_Z_TO_A },
};

export const useCompanyOrderSorting = (
  resetPagination: () => void,
): UseUnifiedOrderSortingResult<CompanySortableColumnKey> => {
  return useUnifiedOrderSorting(COMPANY_SORT_MAP, resetPagination, 'orderId');
};
