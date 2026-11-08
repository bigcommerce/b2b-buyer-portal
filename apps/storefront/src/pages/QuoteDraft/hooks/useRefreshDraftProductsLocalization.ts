import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { getStorefrontLanguageCode } from '@/lib/lang/getStorefrontLanguageCode';
import { searchProducts } from '@/shared/service/b2b';
import {
  activeCurrencyInfoSelector,
  refreshDraftProductsLocalization,
  useAppDispatch,
  useAppSelector,
} from '@/store';
import { QuoteItem } from '@/types/quotes';
import { conversionProductsList } from '@/utils/b3Product/shared/config';

/**
 * Draft products are stored with the text (name, option and modifier labels) of the locale that
 * was active when they were added. Re-fetch them through product search, which localizes by
 * Accept-Language, and refresh only the fields that carry translated text. Quantity, selected
 * options, stock data and pricing stay untouched. When the request fails the stored text keeps
 * being rendered and no error is shown. Nothing runs unless product translation is enabled.
 */
export function useRefreshDraftProductsLocalization(draftQuoteList: QuoteItem[]) {
  const dispatch = useAppDispatch();
  const { currency_code: currencyCode } = useAppSelector(activeCurrencyInfoSelector);
  const companyId = useAppSelector(
    ({ company, b2bFeatures }) => company.companyInfo.id || b2bFeatures.masqueradeCompany.id,
  );
  const customerGroupId = useAppSelector(({ company, b2bFeatures }) =>
    b2bFeatures.masqueradeCompany.isAgenting
      ? b2bFeatures.masqueradeCompany.customerGroupId || company.customer.customerGroupId
      : company.customer.customerGroupId,
  );
  // Subscribing to locales re-renders once they load, they are fetched after the app starts.
  useAppSelector(({ global }) => global.locales);

  const isProductTranslationEnabled = useFeatureFlag('LOCAL-3626.B2B_product_translation');

  const localeCode = getStorefrontLanguageCode();

  const productIds = [...new Set(draftQuoteList.map(({ node }) => Number(node.productsSearch?.id)))]
    .filter(Boolean)
    .sort((a, b) => a - b);

  const { data } = useQuery({
    queryKey: [
      'draftProductsLocalization',
      localeCode,
      productIds,
      companyId,
      customerGroupId,
      currencyCode,
    ],
    // Without the flag the backend does not translate, so the refresh would only replace the stored
    // names. Without a locale no Accept-Language is sent and the answer is in the default language.
    enabled: isProductTranslationEnabled && Boolean(localeCode) && productIds.length > 0,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: async () => {
      const batches = Array.from({ length: Math.ceil(productIds.length / 50) }, (_, index) =>
        productIds.slice(index * 50, (index + 1) * 50),
      );
      const results = await Promise.all(
        batches.map((ids) =>
          // The refresh is a background improvement: a failure must not show an error toast.
          searchProducts(
            {
              productIds: ids,
              currencyCode,
              companyId,
              customerGroupId,
            },
            true,
          ),
        ),
      );

      return conversionProductsList(results.flatMap(({ productsSearch = [] }) => productsSearch));
    },
  });

  useEffect(() => {
    if (isProductTranslationEnabled && localeCode && data?.length) {
      dispatch(refreshDraftProductsLocalization(data));
    }
  }, [data, draftQuoteList, dispatch, isProductTranslationEnabled, localeCode]);
}
