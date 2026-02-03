import { globalSnackbar } from '@/utils/b3Tip';
import { ValidationError } from '@/utils/validationError';

export const addProductsToShoppingListErrorHandler = (error: Error) => {
  const message =
    error instanceof ValidationError ? error.message : 'Something went wrong. Please try again.';

  globalSnackbar.error(message);
};
