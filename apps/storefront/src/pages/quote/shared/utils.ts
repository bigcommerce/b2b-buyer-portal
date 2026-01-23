import { store } from '@/store';
import { getVariantInfoDisplayPrice } from '@/utils/b3Product/b3Product';

const getQuoteDraftShowPriceTBD = (products: CustomFieldItems[]) => {
  const {
    global: {
      blockPendingQuoteNonPurchasableOOS: { isEnableProduct },
      featureFlags,
    },
  } = store.getState();

  if (!isEnableProduct) {
    return false;
  }

  const isHidePrice = products.some((product) => {
    if (!getVariantInfoDisplayPrice(product.node.basePrice, product, featureFlags)) {
      return true;
    }

    return false;
  });

  return isHidePrice;
};

export default getQuoteDraftShowPriceTBD;
