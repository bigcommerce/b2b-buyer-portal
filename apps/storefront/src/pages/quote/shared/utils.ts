import { store } from '@/store';
import { getVariantInfoDisplayPrice } from '@/utils/b3Product/b3Product';

const getQuoteDraftShowPriceTBD = (products: CustomFieldItems[]) => {
  const {
    global: {
      blockPendingQuoteNonPurchasableOOS: { isEnableProduct },
      featureFlags,
      backorderEnabled,
    },
  } = store.getState();

  if (!isEnableProduct) return false;

  const isBackorderValidationEnabled =
    (featureFlags['B2B-3318.move_stock_and_backorder_validation_to_backend'] ?? false) &&
    backorderEnabled;

  const isHidePrice = products.some((product) => {
    if (
      !getVariantInfoDisplayPrice(product.node.basePrice, product, isBackorderValidationEnabled)
    ) {
      return true;
    }

    return false;
  });

  return isHidePrice;
};

export default getQuoteDraftShowPriceTBD;
