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

// companyName and companyIds are permanently dropped from this input — the agreed
// schema gist specified them for customer.orders, but the deployed server never
// implemented them and the gist is being amended to match (B2B-5421). The company
// selector is hidden on My Orders for the same reason (see Order.tsx).
// WORKAROUND (B2B-5420): search is the one field still genuinely pending — it's
// deferred to its own ticket and hidden in the UI until it lands. Restore it here
// once that ticket ships.
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
