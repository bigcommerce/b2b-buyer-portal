export interface CreateCartInput {
  createCartInput: {
    lineItems: Array<{
      quantity: number;
      productEntityId: number;
      variantEntityId: number;
      selectedOptions?: {
        multipleChoices: Array<{
          optionEntityId: number;
          optionValueEntityId: number;
        }>;
        textFields: Array<{
          optionEntityId: number;
          text: string;
        }>;
      };
    }>;
  };
}

export interface DeleteCartInput {
  deleteCartInput: {
    cartEntityId: string;
  };
}
