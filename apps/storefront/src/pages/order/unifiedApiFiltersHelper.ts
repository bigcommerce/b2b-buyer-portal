import {
  CompanyOrdersFiltersInput,
  OrderDateRangeFilterInput,
  OrdersFiltersInput,
} from '@/shared/service/bc/graphql/orders';

export const getCompanyOrdersInitFilter = (companyId: number): CompanyOrdersFiltersInput => ({
  search: undefined,
  dateRange: undefined,
  status: undefined,
  customerId: undefined,
  companyIds: companyId ? [String(companyId)] : undefined,
});

export const getCustomerOrdersInitFilter = (): OrdersFiltersInput => ({
  status: undefined,
  dateRange: undefined,
});

export const normalizeString = (value: string | number | null | undefined): string | undefined => {
  if (value === null || value === undefined) return undefined;
  const str = String(value);
  return str === '' ? undefined : str;
};

export const packDateRange = (
  start: string | null | undefined,
  end: string | null | undefined,
): OrderDateRangeFilterInput | undefined => {
  if (!start) return undefined;
  if (!end) return { from: start };
  return { from: start, to: end };
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const storeDayStartMs = (date: string, storeOffsetSeconds: number) => {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day) - storeOffsetSeconds * 1000;
};

export const toISODateRangeFilters = <T extends { dateRange?: OrderDateRangeFilterInput }>(
  filters: T,
  storeOffsetSeconds: number,
): T => {
  if (!filters.dateRange) return filters;

  const { from, to } = filters.dateRange;
  return {
    ...filters,
    dateRange: {
      from: new Date(storeDayStartMs(from, storeOffsetSeconds)).toISOString(),
      ...(to && {
        to: new Date(storeDayStartMs(to, storeOffsetSeconds) + MS_PER_DAY - 1).toISOString(),
      }),
    },
  };
};
