import { OptionValueProps } from './products';

export interface LineItems {
  quantity: number;
  productId: number;
  variantId: number;
  optionSelections: OptionValueProps[];
}

export interface CreateCartInput {
  createCartInput: {
    lineItems: {
      quantity: number;
      variantEntityId: number;
      productEntityId: number;
      selectedOptions: {
        textFields: {
          optionEntityId: number;
          text: string;
        }[];
        multipleChoices: {
          optionEntityId: number;
          optionValueEntityId: number;
        }[];
      };
    }[];
  };
}

export interface DeleteCartInput {
  deleteCartInput: {
    cartEntityId: string;
  };
}
