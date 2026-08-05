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

// WORKAROUND (B2B-5420): the agreed schema extends OrdersFiltersInput with search,
// companyName and companyIds for customer.orders, but none of the three is implemented,
// so sending any of them fails variable coercion. Restore when the BE ships the
// extension — see B2B-5421.
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
