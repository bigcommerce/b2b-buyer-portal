import {
  ProcessValidationErrorParams,
  ProcessValidationResultsParams,
  ProcessValidationSuccessParams,
  ProcessValidationWarningParams,
  ProductForValidation,
  ProductOptionForValidation,
  TransformProductsForValidationParams,
} from './types';

const processValidationError = ({
  err,
  editableProducts,
  b3Lang,
}: ProcessValidationErrorParams): void => {
  const { variantId } = err.product.node.productsSearch;
  const product = editableProducts.find((product) => product.variant_id === variantId);

  if (!product) {
    return;
  }

  if (err.error.type === 'network') {
    product.helperText = b3Lang('orderDetail.reorder.failedToAdd.helperText');
  } else {
    product.helperText = err.error.message;
  }
};

// since this is the cart context we treat warnings as errors(stock validation)
const processValidationWarning = ({
  warn,
  editableProducts,
}: ProcessValidationWarningParams): void => {
  const { variantId } = warn.product.node.productsSearch;
  const product = editableProducts.find((product) => product.variant_id === variantId);

  if (!product) {
    return;
  }

  product.helperText = warn.message;
};

const processValidationSuccess = ({
  validatedProduct,
  editableProducts,
}: ProcessValidationSuccessParams): void => {
  const { variantId } = validatedProduct.product.node.productsSearch;
  const product = editableProducts.find((product) => product.variant_id === variantId);
  if (product) {
    product.helperText = '';
  }
};

export const processValidationResults = ({
  success,
  warning,
  error,
  editableProducts,
  setEditableProducts,
  b3Lang,
}: ProcessValidationResultsParams): void => {
  error.forEach((err) => {
    processValidationError({
      err,
      editableProducts,
      b3Lang,
    });
  });

  warning.forEach((warn) => {
    processValidationWarning({
      warn,
      editableProducts,
    });
  });

  success.forEach((validatedProduct) => {
    processValidationSuccess({
      validatedProduct,
      editableProducts,
    });
  });

  if (error.length > 0 || warning.length > 0) {
    setEditableProducts([...editableProducts]);
  }
};

export const transformProductsForValidation = ({
  productsToAdd,
  editableProducts,
}: TransformProductsForValidationParams): ProductForValidation[] => {
  const transformed = productsToAdd
    .map((item) => {
      const product = editableProducts.find((product) => product.variant_id === item.variantId);
      if (!product) {
        return null;
      }
      return {
        node: {
          productId: item.productId,
          quantity: item.quantity,
          productName: product.name || '',
          productsSearch: {
            variantId: item.variantId,
            newSelectOptionList: item.optionSelections.map(
              (option): ProductOptionForValidation => ({
                optionId: Number(option.optionId),
                optionValue: String(option.optionValue),
              }),
            ),
          },
        },
      };
    })
    .filter((item): item is ProductForValidation => item !== null);

  return transformed;
};
