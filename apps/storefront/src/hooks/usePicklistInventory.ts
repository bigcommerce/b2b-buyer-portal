import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { searchProducts } from '@/shared/service/b2b';
import { type ProductSearch } from '@/shared/service/b2b/graphql/product';
import { activeCurrencyInfoSelector, useAppSelector } from '@/store';

const toStableIdsKey = (ids: number[]): string => [...new Set(ids)].sort((a, b) => a - b).join(',');

const idsFromKey = (key: string): number[] => (key ? key.split(',').map(Number) : []);

export function usePicklistInventory(productIds: number[]): Record<number, ProductSearch> {
  const [picklistProductsById, setPicklistProductsById] = useState<Record<number, ProductSearch>>(
    {},
  );

  const { currency_code: currencyCode } = useAppSelector(activeCurrencyInfoSelector);
  const companyInfoId = useAppSelector(({ company }) => company.companyInfo.id);
  const customerGroupId = useAppSelector(({ company }) => company.customer.customerGroupId);

  const fetchGenerationRef = useRef(0);

  useEffect(() => {
    fetchGenerationRef.current += 1;
    setPicklistProductsById((prev) => (Object.keys(prev).length === 0 ? prev : {}));
  }, [companyInfoId, customerGroupId, currencyCode]);

  const fetchPicklistProducts = useCallback(
    async (ids: number[]) => {
      const newProductIds = [...new Set(ids)].filter((id) => !picklistProductsById[id]);
      if (newProductIds.length === 0) {
        return;
      }

      const generation = fetchGenerationRef.current;
      try {
        const { productsSearch = [] } = await searchProducts({
          productIds: newProductIds,
          currencyCode,
          companyId: companyInfoId,
          customerGroupId,
        });

        if (generation !== fetchGenerationRef.current) {
          return;
        }

        setPicklistProductsById((prev) => {
          let added = false;
          const next = { ...prev };
          productsSearch.forEach((product: ProductSearch) => {
            next[Number(product.id)] = product;
            added = true;
          });
          // When nothing was added, keep the reference to avoid a refetch loop.
          return added ? next : prev;
        });
      } catch {
        // Inventory fetch failure should not block the consuming list.
      }
    },
    [picklistProductsById, currencyCode, companyInfoId, customerGroupId],
  );

  const productIdsKey = toStableIdsKey(productIds);
  const requestedIds = useMemo(() => idsFromKey(productIdsKey), [productIdsKey]);

  useEffect(() => {
    if (requestedIds.length === 0) {
      return;
    }

    fetchPicklistProducts(requestedIds).catch(() => {});
  }, [requestedIds, fetchPicklistProducts]);

  return picklistProductsById;
}
