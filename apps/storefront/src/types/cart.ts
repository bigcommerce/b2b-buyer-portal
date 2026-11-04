export interface CreateCartInput {
  createCartInput: {
    lineItems: [
      {
        quatinty: number;
        productEntityId: number;
      },
    ];
    locale?: string;
  };
}

export interface DeleteCartInput {
  deleteCartInput: {
    cartEntityId: string;
  };
}
