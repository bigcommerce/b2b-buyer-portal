import { OptionValueProps } from './products';

export interface LineItems {
  quantity: number;
  productId: number;
  variantId: number;
  optionSelections: OptionValueProps[];
}

export interface CreateCartInput {
  createCartInput: {
    lineItems: [
      {
        quatinty: number;
        productEntityId: number;
      },
    ];
  };
}

export interface DeleteCartInput {
  deleteCartInput: {
    cartEntityId: string;
  };
}
