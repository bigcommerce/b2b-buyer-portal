import { store } from '@/store';
import { getVariantInfoDisplayPrice } from '@/utils/b3Product/b3Product';

const getQuoteDraftShowPriceTBD = (products: CustomFieldItems[]) => {
  const {
    global: {
      blockPendingQuoteNonPurchasableOOS: { isEnableProduct },
      backorderEnabled,
    },
  } = store.getState();

  if (!isEnableProduct) return false;

  const isHidePrice = products.some(
    (product) => !getVariantInfoDisplayPrice(product.node.basePrice, product, backorderEnabled),
  );

  return isHidePrice;
};

export default getQuoteDraftShowPriceTBD;
