import { Product } from '@/utils/validateProducts';

import { OrderProductOption } from '../../../types';

interface ProductOptionSelection {
  optionId: number | string;
  optionValue: string | number;
}

export interface ProductToAdd {
  productId: number;
  variantId: number;
  quantity: number;
  optionSelections: ProductOptionSelection[];
  allOptions?: OrderProductOption[];
}

export const adaptProductToAddToProduct = (product: ProductToAdd): ProductToAdd & Product => {
  return {
    ...product,
    productOptions: product.optionSelections.map((option) => {
      // Transform optionId to match Product.Option format
      let optionId: number | `attribute[${number}]`;
      if (typeof option.optionId === 'string' && option.optionId.includes('attribute')) {
        optionId = option.optionId as `attribute[${number}]`;
      } else {
        optionId = Number(option.optionId);
      }
      return {
        optionId,
        optionValue: String(option.optionValue),
      };
    }),
  };
};
