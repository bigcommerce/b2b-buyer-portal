import { OrderDateRangeFilterInput, OrdersFiltersInput } from '@/shared/service/bc/graphql/orders';

export const getCustomerOrdersInitFilter = (companyId: number): OrdersFiltersInput => {
  return {
    status: undefined,
    dateRange: undefined,
    search: undefined,
    companyName: undefined,
    companyIds: companyId ? [String(companyId)] : undefined,
  };
};

export const packDateRange = (
  start: string | null | undefined,
  end: string | null | undefined,
): OrderDateRangeFilterInput | undefined => {
  if (!start) return undefined;
  if (!end) return { from: start };
  return { from: start, to: end };
};
