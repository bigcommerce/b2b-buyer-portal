import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { searchProducts } from '@/shared/service/b2b';
import { type ProductSearch } from '@/shared/service/b2b/graphql/product';
import { activeCurrencyInfoSelector, useAppSelector } from '@/store';

const EMPTY_INVENTORY: Record<number, ProductSearch> = {};

export function usePicklistInventory(productIds: number[]): Record<number, ProductSearch> {
  const { currency_code: currencyCode } = useAppSelector(activeCurrencyInfoSelector);
  const companyInfoId = useAppSelector(({ company }) => company.companyInfo.id);
  const customerGroupId = useAppSelector(({ company }) => company.customer.customerGroupId);

  const requestedIds = [...new Set(productIds)].sort((a, b) => a - b);

  const { data } = useQuery({
    queryKey: ['picklistInventory', { requestedIds, currencyCode, companyInfoId, customerGroupId }],
    enabled: requestedIds.length > 0,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { productsSearch: products = [] } = await searchProducts({
        productIds: requestedIds,
        currencyCode,
        companyId: companyInfoId,
        customerGroupId,
      });

      const inventory: Record<number, ProductSearch> = {};
      products.forEach((product: ProductSearch) => {
        inventory[Number(product.id)] = product;
      });
      return inventory;
    },
  });

  if (requestedIds.length === 0) {
    return EMPTY_INVENTORY;
  }

  return data ?? EMPTY_INVENTORY;
}
