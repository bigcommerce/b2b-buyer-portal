import { LangFormatFunction } from '@/lib/lang';

type Snackbar = {
  error: (message: string) => void;
};

export const cartInventoryErrorMessage = (
  message: string,
  b3Lang: LangFormatFunction,
  snackbar: Snackbar,
  productName: string,
) => {
  if (message.includes("out of stock is out of stock and can't be added to the cart")) {
    snackbar.error(
      b3Lang('purchasedProducts.quickOrderPad.outOfStockSku', {
        outOfStock: productName.concat(','),
      }),
    );
  } else {
    snackbar.error(b3Lang(message));
  }
};
