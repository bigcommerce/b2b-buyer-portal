import { useEffect, useState } from 'react';

import { OrderStatusItem } from '@/types';

import {
  assertSortKey,
  FilterSearchProps,
  getCompanyInitFilter,
  getCustomerInitFilter,
  sortKeys,
} from './config';

type SortDir = 'asc' | 'desc';

interface LegacyAppliedFilters {
  startValue?: string;
  endValue?: string;
  PlacedBy?: string;
  orderStatus?: string | number;
  company?: string;
}

type LegacySortableColumnKey = keyof typeof sortKeys;

interface UseLegacyOrdersFilterStateArgs {
  isB2BUser: boolean;
  isCompanyOrder: boolean;
  selectedCompanyId: number;
  orderStatuses: OrderStatusItem[];
}

interface UseLegacyOrdersFilterStateResult {
  filterData: Partial<FilterSearchProps> | undefined;
  orderBy: string;
  activeSort: { key: LegacySortableColumnKey; dir: SortDir };
  handleSearchChange: (key: string, value: string) => void;
  handleFilterChange: (value: LegacyAppliedFilters) => void;
  handleCompanyIdsChange: (companyIds: number[]) => void;
  handleSetOrderBy: (key: string) => void;
}

const DEFAULT_SORT: { key: LegacySortableColumnKey; dir: SortDir } = {
  key: 'orderId',
  dir: 'desc',
};

export const useLegacyOrdersFilterState = ({
  isB2BUser,
  isCompanyOrder,
  selectedCompanyId,
  orderStatuses,
}: UseLegacyOrdersFilterStateArgs): UseLegacyOrdersFilterStateResult => {
  const [filterData, setFilterData] = useState<Partial<FilterSearchProps>>();
  const [activeSort, setActiveSort] = useState(DEFAULT_SORT);

  useEffect(() => {
    const initial = isB2BUser
      ? getCompanyInitFilter(isCompanyOrder, selectedCompanyId)
      : getCustomerInitFilter();
    setFilterData(initial);
  }, [isB2BUser, isCompanyOrder, selectedCompanyId]);

  const orderBy =
    activeSort.dir === 'desc' ? `-${sortKeys[activeSort.key]}` : sortKeys[activeSort.key];

  const handleSearchChange = (key: string, value: string) => {
    if (key !== 'search') return;
    setFilterData((data) => ({ ...data, q: value }));
  };

  const handleFilterChange = (value: LegacyAppliedFilters) => {
    let currentStatus = String(value?.orderStatus || '');
    if (currentStatus) {
      const originalStatus = orderStatuses.find(
        (status) => status.customLabel === currentStatus || status.systemLabel === currentStatus,
      );
      currentStatus = originalStatus?.systemLabel || currentStatus;
    }

    setFilterData((data) => ({
      ...data,
      beginDateAt: value?.startValue || null,
      endDateAt: value?.endValue || null,
      createdBy: value?.PlacedBy || '',
      statusCode: currentStatus,
      companyName: value?.company || '',
    }));
  };

  const handleCompanyIdsChange = (companyIds: number[]) => {
    const newCompanyIds = companyIds.includes(-1) ? [] : companyIds;
    setFilterData((data) => ({ ...data, companyIds: newCompanyIds }));
  };

  const handleSetOrderBy = (key: string) => {
    assertSortKey(key);
    setActiveSort((prev) => {
      if (prev.key === key) {
        return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
      }
      return { key, dir: 'desc' };
    });
  };

  return {
    filterData,
    orderBy,
    activeSort,
    handleSearchChange,
    handleFilterChange,
    handleCompanyIdsChange,
    handleSetOrderBy,
  };
};
