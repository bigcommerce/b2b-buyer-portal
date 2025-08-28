import { Variant } from '@/types/products';

interface VariantInfo {
  variantId: string | number;
  variantSku?: string;
}

const b2bGetVariantImageByVariantInfo = (currentVariants: Variant[], variantInfo: VariantInfo) => {
  let currentImage = '';

  if (currentVariants && currentVariants.length > 0) {
    const currentProduct = currentVariants.find(
      (item: Variant) =>
        Number(item.variant_id) === Number(variantInfo.variantId) ||
        item.sku === variantInfo?.variantSku,
    );

    if (currentProduct) {
      currentImage = currentProduct?.image_url || '';
    }
  }

  return currentImage;
};

export default b2bGetVariantImageByVariantInfo;
