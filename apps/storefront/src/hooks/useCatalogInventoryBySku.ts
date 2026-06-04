import { useEffect, useMemo, useState } from 'react';

import {
  type CatalogQuickVariantSku,
  getVariantInfoBySkus,
} from '@/shared/service/b2b/graphql/product';

function buildInventoryBySkuMap(
  variantInfoList: CatalogQuickVariantSku[],
): Record<string, CatalogQuickVariantSku> {
  const map: Record<string, CatalogQuickVariantSku> = {};

  variantInfoList.forEach((row) => {
    if (row.variantSku) {
      map[row.variantSku.toUpperCase()] = row;
    }
  });

  return map;
}

interface UseCatalogInventoryBySkuOptions {
  isActive: boolean;
  enabled: boolean;
  skuDependencyKey: string;
}

export function useCatalogInventoryBySku({
  isActive,
  enabled,
  skuDependencyKey,
}: UseCatalogInventoryBySkuOptions): Record<string, CatalogQuickVariantSku> {
  const [variantInfoList, setVariantInfoList] = useState<CatalogQuickVariantSku[]>([]);

  useEffect(() => {
    setVariantInfoList([]);

    if (!isActive || !enabled || !skuDependencyKey) {
      return () => {};
    }

    let cancelled = false;
    const skus = skuDependencyKey.split('|');

    const fetchVariantInfo = async () => {
      try {
        const { variantSku: nextVariantInfoList = [] } = await getVariantInfoBySkus(skus);

        if (!cancelled) {
          setVariantInfoList(nextVariantInfoList);
        }
      } catch {
        if (!cancelled) {
          setVariantInfoList([]);
        }
      }
    };

    fetchVariantInfo();

    return () => {
      cancelled = true;
    };
  }, [isActive, enabled, skuDependencyKey]);

  return useMemo(() => buildInventoryBySkuMap(variantInfoList), [variantInfoList]);
}
