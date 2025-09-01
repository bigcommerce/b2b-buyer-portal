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
