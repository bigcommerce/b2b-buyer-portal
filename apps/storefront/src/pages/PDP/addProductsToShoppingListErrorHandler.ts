import { globalSnackbar, ValidationError } from '@/utils';

export const addProductsToShoppingListErrorHandler = (error: Error) => {
  const message =
    error instanceof ValidationError ? error.message : 'Something went wrong. Please try again.';

  globalSnackbar.error(message);
};
